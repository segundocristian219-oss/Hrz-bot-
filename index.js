process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
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

EventEmitter.defaultMaxListeners = 0;

process.on('uncaughtException', async (err) => {
    console.error(chalk.red.bold('CRITICAL:'), err);
    try { await uploadCriticalError(err, 'Uncaught Exception Global'); } catch {}
});

mongoose.connect('mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/catbot?retryWrites=true&w=majority')
    .then(() => console.log(chalk.greenBright('┃ DATABASE: Local MongoDB Conectado')))
    .catch(() => console.log(chalk.red('┃ DATABASE: Error (Asegúrate que MongoDB esté corriendo)')));

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
cfonts.say('CAT-BOT', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

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

setInterval(async () => {
    const tresDiasAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
    try {
        await global.User.deleteMany({ lastSeen: { $lt: tresDiasAgo } });
        await global.Chat.deleteMany({ lastUpdate: { $lt: tresDiasAgo } });
        const sessionDir = './sessions';
        if (existsSync(sessionDir)) {
            readdirSync(sessionDir).forEach(file => {
                if (file === 'creds.json') return;
                const filePath = join(sessionDir, file);
                const { mtime } = statSync(filePath);
                if (Date.now() - mtime.getTime() > (3 * 24 * 60 * 60 * 1000)) {
                    try { unlinkSync(filePath); } catch {}
                }
            });
        }
    } catch (e) {}
}, 86400000);

global.reload = async function(restatConn) {
  if (restatConn) {
    msgRetryCounterCache.flushAll();
    if (global.conn) {
        global.conn.ev.removeAllListeners();
        try { global.conn.ws.close(); } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        const m = await smsg(conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default;
        if (typeof Func === 'function') await Func.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message.includes('decrypt')) console.error(e);
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

    if (connection === 'open') {
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: CAT-BOT ONLINE`));
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
        global.conn.ev.removeAllListeners();
        let delay = [408, 428, 500, 503].includes(reason) ? 10000 : 3000;
        setTimeout(() => global.reload(true), delay);
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
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

async function initSubBots() {
    const jadibtsDir = path.join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsDir)) return;
    const folders = readdirSync(jadibtsDir).filter(f => 
        statSync(join(jadibtsDir, f)).isDirectory() && existsSync(join(jadibtsDir, f, 'creds.json'))
    );
    for (const folder of folders) {
        try {
            const { assistant_accessJadiBot } = await import(`./plugins/main/serbot.js?update=${Date.now()}`);
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false });
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (e) {}
    }
}
