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
import * as MsgHandler from './lib/message.js';

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

EventEmitter.defaultMaxListeners = 100;

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
cfonts.say('CAT-BOT', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });
cfonts.say('Powered by VOKER', { font: 'console', align: 'center', colors: ['white'], space: false });

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

global.plugins = new Map();
global.aliases = new Map();

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
  maxMsgRetryCount: 9,
  msgRetryCounterCache,
  connectTimeoutMs: 60000, 
  defaultQueryTimeoutMs: 0, 
  keepAliveIntervalMs: 10000, 
  generateHighQualityLinkPreview: false, 
  syncFullHistory: false,
  markOnlineOnConnect: true
};

global.conn = makeWASocket(connectionOptions);
global.conn.contacts = global.conn.contacts || {}; 

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

const cleanSessions = async () => {
    const sessionDir = './sessions';
    if (!existsSync(sessionDir)) return;
    const files = readdirSync(sessionDir);
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    for (const file of files) {
        if (file === 'creds.json' || statSync(join(sessionDir, file)).isDirectory()) continue;
        const filePath = join(sessionDir, file);
        if (now - statSync(filePath).mtime.getTime() > threeDays) {
            try { unlinkSync(filePath); } catch {}
        }
    }
};

setInterval(cleanSessions, 3600000);

if (global.db) setInterval(async () => { 
    if (global.db.data && !global.db.READ) await global.db.write().catch(console.error);
}, 60000);

global.reload = async function(restatConn) {
  if (restatConn) {
    if (global.conn) {
        global.conn.ev.removeAllListeners();
        try { global.conn.ws.close(); } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    global.conn = makeWASocket(connectionOptions);
    global.conn.contacts = global.conn.contacts || {}; 
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || !msg.message) return;
        const m = await smsg(conn, msg);
        const handler = MsgHandler.message || MsgHandler.default;
        if (typeof handler === 'function') handler.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message.includes('decrypt')) {
          console.error(e);
          await uploadCriticalError(e, 'Message Upsert');
        }
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.cyan('┃ ') + `Sincronizando...`);
    if (connection === 'open') {
        global.botNumber = jidNormalizedUser(conn.user.id);
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: CAT-BOT ONLINE`));
        global.isBotReady = true;
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
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
      if (reason !== DisconnectReason.loggedOut) {
          setTimeout(() => global.reload(true), 5000);
      } else { process.exit(1); }
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
async function readRecursive(folder) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (filename.endsWith('.js')) {
      try {
        const module = await import(`file://${file}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || basename(filename, '.js');
        global.plugins.set(pluginName, plugin);
        if (plugin.alias) {
            const aliases = Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias];
            aliases
