process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, unlinkSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import mongoose from 'mongoose';
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { uploadCriticalError } from './lib/db_logs.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = function () {
  const args = Array.from(arguments);
  originalLog.apply(console, [chalk.cyan('┃'), ...args]);
};

const originalError = console.error;
console.error = function () {
  const args = Array.from(arguments);
  originalError.apply(console, [chalk.red('┗'), ...args]);
};

EventEmitter.defaultMaxListeners = 0;

process.on('uncaughtException', async (err) => {
    console.error(chalk.red.bold('CRITICAL:'), err);
    try { await uploadCriticalError(err, 'Uncaught Exception Global'); } catch {}
});

mongoose.connect('mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/catbot?retryWrites=true&w=majority', {
    tls: true,
    tlsAllowInvalidCertificates: true, 
    serverSelectionTimeoutMS: 5000,    
    connectTimeoutMS: 10000,
    family: 4                          
})
.then(() => console.log(chalk.greenBright('┃ DATABASE: Conectado (Bypass SSL Activo)')))
.catch((err) => {
    console.error(chalk.red('┃ DATABASE: Error de Conexión ->'), err.message);
    setTimeout(() => global.reload(true), 5000);
});

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    lastSeen: { type: Date, default: Date.now }
}, { strict: false });
global.User = mongoose.model('User', userSchema);

const chatSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    isBanned: { type: Boolean, default: false },
    lastUpdate: { type: Date, default: Date.now }
}, { strict: false });
global.Chat = mongoose.model('Chat', chatSchema);

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();
cfonts.say('Guilty', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });
cfonts.say('Powered by VOKER', { font: 'console', align: 'center', colors: ['white'], space: false });
console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();
global.groupCache = new Map();

const connectionOptions = {
  version,
  logger: pino({ level: 'silent' }), 
  printQRInTerminal: false,
  browser: Browsers.ubuntu("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })), 
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 60000,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  getMessage: async (key) => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));
    console.log(chalk.cyan('┃ ') + chalk.bold('AUTENTICACIÓN REQUERIDA'));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Ingresa el número:\n` + chalk.cyan('┗ ') + `> `);
    let addNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
            console.log(chalk.cyan('┃ ') + chalk.bgWhite.black.bold(` CÓDIGO: ${codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

const cleanSessions = async () => {
    const sessionDir = './sessions';
    if (!existsSync(sessionDir)) return;
    const files = readdirSync(sessionDir);
    const now = Date.now();
    const limit = 3 * 24 * 60 * 60 * 1000;
    for (const file of files) {
        if (file === 'creds.json') continue;
        const filePath = join(sessionDir, file);
        try {
            const { mtime } = statSync(filePath);
            if (now - mtime.getTime() > limit) unlinkSync(filePath);
        } catch (e) {}
    }
};

setInterval(async () => {
    const tresDiasAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
    try {
        await global.User.deleteMany({ lastSeen: { $lt: tresDiasAgo } });
        await global.Chat.deleteMany({ lastUpdate: { $lt: tresDiasAgo } });
        await cleanSessions();
    } catch (e) {}
}, 86400000);

let messageHandler;
const loadHandler = async () => {
    try {
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        messageHandler = module.message || module.default?.message || module.default;
    } catch (e) { console.error(e); }
};
await loadHandler();
watch(path.join(process.cwd(), 'lib/message.js'), loadHandler);

global.reload = async function(restatConn) {
  if (restatConn) {
    msgRetryCounterCache.flushAll();
    if (global.conn) {
        global.conn.ev.removeAllListeners();
        try { global.conn.ws.close(); } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        const m = await smsg(conn, msg);
        if (typeof messageHandler === 'function') await messageHandler.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message?.includes('decrypt')) {
            console.error(e);
            await uploadCriticalError(e, 'Message Upsert');
        }
    }
  });

  global.conn.ev.on('groups.update', async ([update]) => {
      const id = update.id;
      if (global.groupCache.has(id)) {
          let current = global.groupCache.get(id);
          global.groupCache.set(id, { ...current, ...update });
      }
  });

  global.conn.ev.on('group-participants.update', async ({ id }) => {
      try {
          const fresh = await conn.groupMetadata(id);
          global.groupCache.set(id, fresh);
      } catch (e) {}
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        console.log(chalk.cyan('┃ ') + chalk.white(`USER: ${conn.user.name}`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        await monitorBot(conn, 'online');
        if (global.keepAlive) clearInterval(global.keepAlive);
        global.keepAlive = setInterval(async () => {
            try { await conn.updateProfileStatus(`Voker Active: ${new Date().toLocaleString()}`); } catch {}
        }, 10 * 60 * 1000);
        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }

    if (connection === 'close') {
        await monitorBot(conn, 'offline');
        if (reason === DisconnectReason.loggedOut) process.exit(1);
        if (global.conn) {
            global.conn.ev.removeAllListeners();
            try { global.conn.ws.close(); } catch {}
        }
        let delay = [408, 428, 500, 503].includes(reason) ? 10000 : 3000;
        setTimeout(() => global.reload(true), delay);
    }
  });

  global.conn.ev.on('creds.update', saveCreds);

  const eventFolder = join(process.cwd(), 'lib/event');
  if (existsSync(eventFolder)) {
      readdirSync(eventFolder).forEach(async (file) => {
          if (file.endsWith('.js')) {
              try {
                  const module = await import(`file://${join(eventFolder, file)}?update=${Date.now()}`);
                  const eventFunc = module.default || module;
                  if (typeof eventFunc === 'function') eventFunc(global.conn);
              } catch (e) {}
          }
      });
  }
};

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      try {
        const module = await import(`file://${file}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || basename(filename, '.js');
        global.plugins.set(pluginName, plugin);
        if (plugin.alias) {
            const aliases = Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias];
            aliases.forEach(a => global.aliases.set(a, pluginName));
        }
      } catch (e) {}
    }
  }
}
await readRecursive(pluginFolder);

watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = join(pluginFolder, filename);
    if (existsSync(dir) && statSync(dir).isFile()) {
      try {
        const module = await import(`file://${dir}?update=${Date.now()}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || basename(filename, '.js');
        for (const [a, p] of global.aliases.entries()) if (p === pluginName) global.aliases.delete(a);
        global.plugins.set(pluginName, plugin);
        if (plugin.alias) {
            const aliases = Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias];
            aliases.forEach(a => global.aliases.set(a, pluginName));
        }
        console.log(chalk.cyan('┃ ') + chalk.white(`Update: ${pluginName}`));
      } catch (e) {}
    }
  }
});

async function initSubBots() {
    const jadibtsDir = path.join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsDir)) return;
    const folders = readdirSync(jadibtsDir).filter(f => 
        statSync(join(jadibtsDir, f)).isDirectory() && existsSync(join(jadibtsDir, f, 'creds.json'))
    );
    await Promise.allSettled(folders.map(async (folder) => {
        try {
            const { assistant_accessJadiBot } = await import(`./plugins/main/serbot.js?update=${Date.now()}`);
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false });
        } catch (e) {}
    }));
}