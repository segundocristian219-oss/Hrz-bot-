process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, createWriteStream, unlinkSync, rmSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import axios from 'axios'; 
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { uploadCriticalError } from './lib/db_logs.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = function () {
  const args = Array.from(arguments);
  originalLog.apply(console, [chalk.cyan('┃'), ...args]);
};

const originalDir = console.dir;
console.dir = function () {
  const args = Array.from(arguments);
  originalDir.apply(console, args);
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

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser,
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();

cfonts.say('CAT-BOT', {
    font: 'slick', 
    align: 'center',
    colors: ['cyan', 'white'],
    letterSpacing: 2
});

cfonts.say('Powered by VOKER', {
    font: 'console',
    align: 'center',
    colors: ['white'],
    space: false
});
console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const adapter = new JSONFile('database.json');
global.db = new Low(adapter, { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} });

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  global.db.READ = true;
  await global.db.read().catch((e) => console.error(e));
  global.db.READ = null;
  global.db.data = global.db.data || { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} };
};
await loadDatabase();

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
  cachedGroupMetadata: async (jid) => {
    const cache = global.groupCache.get(jid);
    if (cache) return cache;
    return global.db.data?.chats[jid]?.metadata || null;
  },
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 60000,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 2000,
  maxRetries: 5,
  getMessage: async (key) => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);
global.conn.contacts = global.conn.contacts || {}; 

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
        } catch (e) {
            console.error(e);
        }
    }, 3000);
}

const cleanSessions = async () => {
    const sessionDir = './sessions';
    if (!existsSync(sessionDir)) return;
    const files = readdirSync(sessionDir);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    for (const file of files) {
        if (file === 'creds.json' || statSync(join(sessionDir, file)).isDirectory()) continue;
        const filePath = join(sessionDir, file);
        const { mtime } = statSync(filePath);
        if (now - mtime.getTime() > oneDay) {
            try {
                unlinkSync(filePath);
            } catch (e) { console.error(e); }
        }
    }
};

setInterval(cleanSessions, 3600000);

if (global.db) setInterval(async () => { 
    if (global.db.data && !global.db.READ) {
        await global.db.write().catch(console.error);
    }
}, 60000);

global.reload = async function(restatConn) {
  if (restatConn) {
    msgRetryCounterCache.flushAll();
    if (global.conn) {
        global.conn.ev.removeAllListeners();
        try { global.conn.ws.close(); } catch (e) {}
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
    global.conn = makeWASocket(connectionOptions);
    global.conn.contacts = global.conn.contacts || {}; 
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        const m = await smsg(conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default?.message || module.default;
        if (typeof Func === 'function') await Func.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message.includes('decrypt')) {
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

  global.conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
      try {
          const fresh = await conn.groupMetadata(id);
          global.groupCache.set(id, fresh);
      } catch (e) {}
  });

  global.conn.ev.on('contacts.upsert', (contacts) => {
    for (let contact of contacts) {
      let id = global.conn.decodeJid(contact.id);
      if (id) {
        if (!global.conn.contacts) global.conn.contacts = {};
        let data = { 
          id, 
          name: contact.verifiedName || contact.name || contact.notify 
        };
        global.conn.contacts[id] = data;
        if (global.db.data) {
           global.db.data.users[id] = { ...global.db.data.users[id], name: data.name };
        }
      }
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.cyan('┃ ') + `Sincronizando con servidores...`);
    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: CAT-BOT ONLINE`));
        console.log(chalk.cyan('┃ ') + chalk.white(`USER: ${conn.user.name}`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        global.isBotReady = true;
        await monitorBot(conn, 'online');
        await cleanSessions();

        if (global.keepAlive) clearInterval(global.keepAlive);
        global.keepAlive = setInterval(async () => {
            try {
                await conn.updateProfileStatus(`Voker Active: ${new Date().toLocaleString()}`);
            } catch (e) {}
        }, 10 * 60 * 1000);

        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }

        if (connection === 'close') {
        await monitorBot(conn, 'offline');
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;

        if (reason === DisconnectReason.loggedOut) {
            process.exit(1);
        }

        console.error(chalk.red(`[!] Conexión cerrada: ${reason}. Reiniciando...`));
        
        if (global.conn) {
            global.conn.ev.removeAllListeners();
            try { global.conn.ws.close(); } catch {}
        }

        let delay = [408, 428, 500, 503].includes(reason) ? 10000 : 2000;

        setTimeout(() => {
            global.reload(true);
        }, delay);
    }


      if (reason === 403 || (lastDisconnect?.error?.message?.includes('decrypt'))) {
          console.log(chalk.red('┃ Error crítico de llaves. Reasentando sesión...'));
          await global.reload(true);
      } else if (reason !== DisconnectReason.loggedOut) {
          let delay = reason === 428 ? 20000 : 10000; 
          console.log(chalk.yellow(`Reconectando en ${delay/1000}s...`));
          setTimeout(() => global.reload(true), delay);
      } else {
          process.exit(1); 
      }
    }
  });

  global.conn.ev.on('creds.update', async () => {
      await saveCreds();
  });

  const eventFolder = join(process.cwd(), 'lib/event');
  if (existsSync(eventFolder)) {
      const eventFiles = readdirSync(eventFolder).filter(file => file.endsWith('.js'));
      for (const file of eventFiles) {
          try {
              const module = await import(`file://${join(eventFolder, file)}?update=${Date.now()}`);
              const eventFunc = module.default || module;
              if (typeof eventFunc === 'function') eventFunc(global.conn);
          } catch (e) {
              console.error(`Error en evento ${file}:`, e);
          }
      }
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
      } catch (e) { console.error(e); }
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
      } catch (e) { console.error(e); }
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
        } catch (e) { console.error(e); }
    }));
}
