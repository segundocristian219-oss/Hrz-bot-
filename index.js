process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, unlinkSync } from 'fs';
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
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { uploadCriticalError } from './lib/db_logs.js';
import { EventEmitter } from 'events';
import * as MsgHandler from './lib/message.js';

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

EventEmitter.defaultMaxListeners = 100;

process.on('uncaughtException', async (err) => {
    console.error(chalk.red.bold('CRITICAL:'), err);
    try { await uploadCriticalError(err, 'Global Exception'); } catch {}
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
cfonts.say('CAT-BOT', { font: 'slick', align: 'center', colors: ['cyan', 'white'] });

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
  await global.db.read().catch(console.error);
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
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 30000,
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);

global.reload = async function(restatConn) {
  if (restatConn) {
    if (global.conn) {
        try { global.conn.ws.close(); } catch {}
        global.conn.ev.removeAllListeners();
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('creds.update', saveCreds);

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.cyan('┃ ') + `Sincronizando...`);
    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        global.isBotReady = true;
        await monitorBot(conn, 'online');
        if (global.keepAlive) clearInterval(global.keepAlive);
        global.keepAlive = setInterval(async () => {
            try { await conn.updateProfileStatus(`Voker Active | ${new Date().toLocaleString()}`); } catch {}
        }, 10 * 60 * 1000);
    }

    if (connection === 'close') {
      await monitorBot(conn, 'offline');
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
      if (reason === DisconnectReason.restartRequired || reason === 500) {
          setTimeout(() => global.reload(true), 10000);
      } else if (reason !== DisconnectReason.loggedOut) {
          setTimeout(() => global.reload(true), 15000);
      } else {
          process.exit(1);
      }
    }
  });

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || !msg.message) return;
        const m = await smsg(conn, msg);
        const handler = MsgHandler.message || MsgHandler.default;
        if (typeof handler === 'function') await handler.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message.includes('decrypt')) console.error(e);
    }
  });
};

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
global.plugins = new Map();

async function loadPlugins(folder) {
  const files = readdirSync(folder);
  for (const file of files) {
    const filePath = join(folder, file);
    if (statSync(filePath).isDirectory()) {
        await loadPlugins(filePath);
    } else if (file.endsWith('.js')) {
      try {
        const module = await import(`file://${filePath}?update=${Date.now()}`);
        global.plugins.set(basename(file, '.js'), module.default || module);
      } catch (e) { console.error(e); }
    }
  }
}

await loadPlugins(pluginFolder);

setInterval(() => {
    const tmpDir = './tmp';
    if (!existsSync(tmpDir)) return;
    const files = readdirSync(tmpDir);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    files.forEach(file => {
        const filePath = join(tmpDir, file);
        if (Date.now() - statSync(filePath).mtimeMs > threeDays) {
            try { unlinkSync(filePath); } catch {}
        }
    });
}, 3600000);

setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error);
}, 30000);
