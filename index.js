process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, unlinkSync, promises as fsP } from 'fs';
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
    try { await uploadCriticalError(err, 'Uncaught Exception Global'); } catch {}
});

mongoose.connect('mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/catbot?retryWrites=true&w=majority', {
    tls: true,
    tlsAllowInvalidCertificates: true, 
    serverSelectionTimeoutMS: 5000,    
    family: 4                          
}).catch(() => {
    setTimeout(() => global.reload(true), 5000);
});

const userSchema = new mongoose.Schema({ id: { type: String, unique: true }, lastSeen: { type: Date, default: Date.now } }, { strict: false });
global.User = mongoose.model('User', userSchema);
const chatSchema = new mongoose.Schema({ id: { type: String, unique: true }, isBanned: { type: Boolean, default: false } }, { strict: false });
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
cfonts.say('CORE OPTIMIZED', { font: 'console', align: 'center', colors: ['white'], space: false });

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
  generateHighQualityLinkPreview: false,
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 45000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  getMessage: async () => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Número: `);
    let addNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.bgWhite.black.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join("-") || codeBot} `));
        } catch {}
    }, 2000);
}

const cleanSessions = async () => {
    if (!existsSync(sessionPath)) return;
    const files = await fsP.readdir(sessionPath);
    const now = Date.now();
    const limit = 3 * 24 * 60 * 60 * 1000;
    await Promise.all(files.map(async (file) => {
        if (file === 'creds.json' || file.includes('app-state')) return;
        const filePath = join(sessionPath, file);
        try {
            const st = await fsP.stat(filePath);
            if (now - st.mtimeMs > limit) await fsP.unlink(filePath);
        } catch {}
    }));
};

setInterval(async () => {
    try {
        const tresDiasAgo = new Date(Date.now() - 259200000);
        await Promise.all([
            global.User.deleteMany({ lastSeen: { $lt: tresDiasAgo } }),
            global.Chat.deleteMany({ lastUpdate: { $lt: tresDiasAgo } }),
            cleanSessions()
        ]);
    } catch {}
}, 86400000);

let messageHandler;
const loadHandler = async () => {
    try {
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        messageHandler = module.message || module.default?.message || module.default;
    } catch {}
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
    await new Promise(r => setTimeout(r, 2000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return;
    try {
        const m = await smsg(conn, msg);
        if (messageHandler) messageHandler.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message?.includes('decrypt')) uploadCriticalError(e, 'Message Upsert');
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
            console.log(chalk.yellow('┃ Conexión inestable. Reintentando...'));
            setTimeout(() => global.reload(true), 3000);
        } else {
            process.exit(1);
        }
    }
    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        
        const updateStatus = async () => {
            try {
                const time = new Date().toLocaleString('es-HN', { hour12: true });
                await conn.updateProfileStatus(`APOCALYPSE VX | ${time}`).catch(() => null);
            } catch {}
        };
        updateStatus();
        if (global.keepAlive) clearInterval(global.keepAlive);
        global.keepAlive = setInterval(updateStatus, 600000);
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();

global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
  const files = await fsP.readdir(folder);
  await Promise.all(files.map(async (filename) => {
    const file = join(folder, filename);
    const st = await fsP.stat(file);
    if (st.isDirectory()) await readRecursive(file);
    else if (/\.js$/.test(filename)) {
      try {
        const module = await import(`file://${file}`);
        const plugin = module.default || module;
        const name = plugin.name || basename(filename, '.js');
        global.plugins.set(name, plugin);
        if (plugin.alias) (Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias]).forEach(a => global.aliases.set(a, name));
      } catch {}
    }
  }));
}
await readRecursive(join(process.cwd(), './plugins'));
