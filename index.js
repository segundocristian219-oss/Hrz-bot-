import 'dotenv/config';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');

const blockKeywords = [
    'SessionEntry', 'ratchetKey', 'chainKey', 'senderKey', 
    'aliceBaseKey', 'bobBaseKey', 'currentRatchet', 
    'messageKeys', 'nextHeader', 'index', 'ratchet',
    'closing session', 'Closing session'
];

const filterOutput = (chunk, originalWrite, encoding, callback) => {
    try {
        const msg = chunk.toString();
        if (blockKeywords.some(k => msg.includes(k))) return true;
        return originalWrite(chunk, encoding, callback);
    } catch {
        return originalWrite(chunk, encoding, callback);
    }
};

const stdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => filterOutput(chunk, stdoutWrite, encoding, callback);

const stderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => filterOutput(chunk, stderrWrite, encoding, callback);

import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, promises as fsP } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import mongoose from 'mongoose';
import { smsg } from './lib/serializer.js';
import { EventEmitter } from 'events';
import { LocalDB } from './lib/localDB.js';
import { exec } from "child_process";

EventEmitter.defaultMaxListeners = 0;

const silentLogger = pino({ 
    level: 'silent',
    base: null,
    serializers: { err: () => {}, res: () => {}, req: () => {} }
});

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);

const originalError = console.error;
console.error = (...args) => originalError.apply(console, [chalk.red('┗'), ...args]);

const mongoURI = process.env.MONGODB_URL;

const logDB = (type, status) => {
    console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
    console.log(chalk.cyan('┃ ') + chalk.bold(`DATABASE: `) + (type === 'CLOUD' ? chalk.blueBright(type) : chalk.yellowBright(type)));
    console.log(chalk.cyan('┃ ') + chalk.bold(`STATUS:   `) + (status === 'CONNECTED' ? chalk.greenBright(status) : chalk.redBright(status)));
    console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
};

function activateLocalDB() {
    if (!existsSync('./database')) mkdirSync('./database');
    global.User = LocalDB.model('User');
    global.Chat = LocalDB.model('Chat');
    global.Stats = LocalDB.model('Stats'); 
    logDB('LOCAL', 'CONNECTED');
}

console.clear();
cfonts.say('KIRITO', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });

if (mongoURI && !process.argv.includes('--local')) {
    mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        family: 4
    }).then(() => {
        logDB('CLOUD', 'CONNECTED');
    }).catch(() => {
        logDB('CLOUD', 'ERROR');
        activateLocalDB();
    });

    const userSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        lastSeen: { type: Date, default: Date.now }
    }, { strict: false });
    global.User = mongoose.model('User', userSchema);

    const chatSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        isBanned: { type: Boolean, default: false }
    }, { strict: false });
    global.Chat = mongoose.model('Chat', chatSchema);

   const statsSchema = new mongoose.Schema({
        command: { type: String, unique: true }
    }, { strict: false });
    global.Stats = mongoose.model('Stats', statsSchema);
} else {
    activateLocalDB();
}

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');

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
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
global.groupCache = new Map();

const connectionOptions = {
  version,
  logger: silentLogger, 
  printQRInTerminal: false,
  browser: Browsers.ubuntu("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, silentLogger), 
  },
  markOnlineOnConnect: true,
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  keepAliveIntervalMs: 15000,
  emitOwnEvents: true,
  getMessage: async () => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);
global.conn.isMain = true;
if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Número: `);
    let addNumber = phoneNumber.replace(/\D/g, '');
    rl.close();
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.bgBlack.white.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join("-") || codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

const cleanSessions = async () => {
    try {
        const files = await fsP.readdir(sessionPath);
        const limit = 3 * 24 * 60 * 60 * 1000;
        await Promise.all(files.map(async (file) => {
            if (file === 'creds.json') return;
            const filePath = join(sessionPath, file);
            const st = await fsP.stat(filePath);
            if (Date.now() - st.mtimeMs > limit) await fsP.unlink(filePath);
        }));
    } catch {}
};

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
    try { global.conn.ws.close(); } catch {}
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.removeAllListeners('messages.upsert');
    global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg || (!msg.message && !msg.messageStubType)) return;
    try {
        const m = await smsg(conn, msg);
        if (messageHandler) await messageHandler.call(conn, m, chatUpdate);

        
        if (m.isGroup && !global.groupCache.has(m.chat)) {
            const metadata = await conn.groupMetadata(m.chat).catch(() => null);
            if (metadata) global.groupCache.set(m.chat, metadata);
        }
        
    } catch (e) { 
        if (!e.message?.includes('decrypt')) console.error(e); 
    }
  });

  global.conn.ev.removeAllListeners('connection.update');
  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
        if (reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
            setTimeout(() => global.reload(true), 3000);
        } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.forbidden) {
            console.error(chalk.red(`┃ STATUS: LOGGED OUT - ELIMINANDO SESIÓN`));
            exec(`rm -rf ${sessionPath}/*`);
            process.exit(1);
        } else {
            setTimeout(() => global.reload(true), 5000);
        }
    }
    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        await cleanSessions();

        setTimeout(async () => {
            try {
                const { loadSubBots } = await import('./lib/serbot.js');
                await loadSubBots(global.conn);
            } catch (e) {}
        }, 1000);

        const updateStatus = async () => {
            try {
                const time = new Date().toLocaleString('es-HN', { hour12: true });
                await conn.query({
                    tag: 'iq',
                    attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                    content: [{ tag: 'status', attrs: {}, content: Buffer.from(`KIRITO BOT MD | ${time}`, 'utf-8') }]
                });
            } catch {}
        };
        updateStatus();
        if (global.keepAlive) clearInterval(global.keepAlive);
        global.keepAlive = setInterval(updateStatus, 600000);
    }
  });
  global.conn.ev.on('creds.update', saveCreds);

  global.conn.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      if (global.groupCache instanceof Map && global.groupCache.has(update.id)) {
        global.groupCache.delete(update.id);
      }
    }
  });

  global.conn.ev.on('group-participants.update', async (update) => {
    if (global.groupCache instanceof Map && global.groupCache.has(update.id)) {
      global.groupCache.delete(update.id);
    }
  });
};

await global.reload();

import('./lib/event/antiStatus.js').then(module => module.default(global.conn)).catch(() => {});

global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
  const files = await fsP.readdir(folder);
  for (let filename of files) {
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
      } catch (e) { console.error(e); }
    }
  }
}
await readRecursive(join(process.cwd(), './plugins'));

process.on('uncaughtException', (err) => {
  const msg = err?.message || '';
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
});

process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason || '');
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
});