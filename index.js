import 'dotenv/config';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync } from 'fs';
import { promises as fsP } from 'fs';
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

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);
const originalError = console.error;
console.error = (...args) => originalError.apply(console, [chalk.red('┗'), ...args]);

EventEmitter.defaultMaxListeners = 0;

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
    }).catch(e => {
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
if (!existsSync('./jadibts')) mkdirSync('./jadibts');

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');
global.conns = [];

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
global.groupCache = new Map();

const connectionOptions = {
  version,
  logger: pino({ level: 'fatal' }), 
  printQRInTerminal: false,
  browser: Browsers.ubuntu("Chrome"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })), 
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

const originalSendMessage = global.conn.sendMessage;



global.conn.sendMessage = async (jid, content, options = {}) => {
    const isTextEmpty = content.text && content.text.trim().length === 0;
    
    const isContentEmpty = !content.text && !content.image && !content.video && !content.sticker && !content.document && !content.audio && !content.location && !content.contact && !content.contacts && !content.poll && !content.react;
    
    if (isTextEmpty || isContentEmpty) {
        const stack = new Error().stack;
        const report = `⚠️ *DEBUG: MENSAJE VACÍO*\n\n📍 *Destino:* ${jid}\n📂 *Content:* ${JSON.stringify(content)}\n\n🔍 *Stack Trace:* \n${stack}`;
        await originalSendMessage.apply(global.conn, ['50432955554@s.whatsapp.net', { text: report }]);
    }
    return originalSendMessage.apply(global.conn, [jid, content, options]);
};




if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Número: `);
    let addNumber = phoneNumber.replace(/\D/g, '');
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
    const retrySendMessage = global.conn.sendMessage;
    global.conn.sendMessage = async (jid, content, options = {}) => {
        const isTextEmpty = content.text && content.text.trim().length === 0;
        const isContentEmpty = !content.text && !content.image && !content.video && !content.sticker && !content.document && !content.audio && !content.location && !content.contact && !content.contacts && !content.poll;
        if (isTextEmpty || isContentEmpty) {
            const stack = new Error().stack;
            const report = `⚠️ *DEBUG: MENSAJE VACÍO*\n\n📍 *Destino:* ${jid}\n📂 *Content:* ${JSON.stringify(content)}\n\n🔍 *Stack Trace:* \n${stack}`;
            await retrySendMessage.apply(global.conn, ['50432955554@s.whatsapp.net', { text: report }]);
        }
        return retrySendMessage.apply(global.conn, [jid, content, options]);
    };
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg || (!msg.message && !msg.messageStubType)) return;
    try {
        const m = await smsg(conn, msg);
        if (messageHandler) await messageHandler.call(conn, m, chatUpdate);
    } catch (e) { 
        if (!e.message?.includes('decrypt')) console.error(e); 
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) setTimeout(() => global.reload(true), 3000);
        else process.exit(1);
    }
    if (connection === 'open') {
        global.botNumber = conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        await cleanSessions();
        try {
            const { assistant_accessJadiBot } = await import('./plugins/main/serbot.js');
            const subbots = readdirSync('./jadibts').filter(file => statSync(join('./jadibts', file)).isDirectory());
            for (const id of subbots) {
                if (existsSync(join('./jadibts', id, 'creds.json'))) {
                    setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), 2000);
                }
            }
        } catch (e) {}
        const updateStatus = async () => {
            try {
                const time = new Date().toLocaleString('es-HN', { hour12: true });
                await conn.query({
                    tag: 'iq',
                    attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                    content: [{ tag: 'status', attrs: {}, content: Buffer.from(`APOCALYPSE VX | ${time}`, 'utf-8') }]
                });
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

import('./lib/event/antiStatus.js').then(module => module.default(global.conn));

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
