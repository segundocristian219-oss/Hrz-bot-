import 'dotenv/config';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, mkdirSync, watch, promises as fsP } from 'fs';
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

process.removeAllListeners('warning');
EventEmitter.defaultMaxListeners = 0;

const maskLogs = (chunk, encoding, callback, originalWrite) => {
    const msg = chunk?.toString?.() || '';
    if (msg.includes('Closing session') || msg.includes('Removing old closed session') || msg.includes('Bad MAC') || msg.includes('Failed to decrypt')) {
        if (typeof encoding === 'function') encoding();
        else if (typeof callback === 'function') callback();
        return true;
    }
    return originalWrite(chunk, encoding, callback);
};

const _stdout = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => maskLogs(chunk, encoding, callback, _stdout);
const _stderr = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => maskLogs(chunk, encoding, callback, _stderr);

const sId = (jid) => jid?.includes('@') ? jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' : jid?.split(':')[0] + '@s.whatsapp.net';

global.subbotConfig = {};

process.on('uncaughtException', (err) => {
    if (err?.message?.match(/rate-overlimit|timed out|Connection Closed|decrypt/)) return;
    console.error('⚠️ ERROR NO CONTROLADO:', err);
});

const silentLogger = pino({ level: 'silent' });
const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);

const dbUrlEncoded = process.env.MONGODB_URL;
const dbUrlDecoded = Buffer.from(dbUrlEncoded, 'base64').toString('utf-8');

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

if (dbUrlDecoded && !process.argv.includes('--local')) {
    mongoose.connect(dbUrlDecoded, { serverSelectionTimeoutMS: 5000, family: 4 }).then(() => {
        logDB('CLOUD', 'CONNECTED');
        global.db = mongoose.connection.db;
    }).catch(() => {
        logDB('CLOUD', 'ERROR');
        activateLocalDB();
    });

    global.User = mongoose.model('User', new mongoose.Schema({ id: { type: String, unique: true }, lastSeen: { type: Date, default: Date.now } }, { strict: false }));
    global.Chat = mongoose.model('Chat', new mongoose.Schema({ id: { type: String, unique: true }, isBanned: { type: Boolean, default: false } }, { strict: false }));
    global.Warns = mongoose.model('Warns', new mongoose.Schema({ userId: String, groupId: String, reasons: [String], warnCount: Number, date: { type: Date, default: Date.now } }).index({ userId: 1, groupId: 1 }, { unique: true }));
    global.News = mongoose.model('News', new mongoose.Schema({ title: String, description: String, command: String, date: Date }, { strict: false }));
    global.SubBotSettings = mongoose.model('SubBotSettings', new mongoose.Schema({ botId: { type: String, unique: true }, prefix: String, botName: String, botImage: String, status: Boolean }, { strict: false }));
    global.Stats = mongoose.model('Stats', new mongoose.Schema({ command: { type: String, unique: true }, globalUsage: Number, groups: Map }, { strict: false }));
} else {
    activateLocalDB();
}

const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys');

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') => rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
global.groupCache = new Map();

const connectionOptions = {
    version, logger: silentLogger, printQRInTerminal: false, browser: Browsers.ubuntu("Chrome"),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, silentLogger) },
    markOnlineOnConnect: true, syncFullHistory: false, connectTimeoutMs: 60000, emitOwnEvents: true,
    patchMessageBeforeSending: (message) => {
        if (message.interactiveMessage || message.templateMessage || message.listMessage) {
            return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
        }
        return message;
    }
};

global.conn = makeWASocket(connectionOptions);
global.conn.isMain = true;

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const phoneNumber = await new Promise(r => rl.question(chalk.cyan('┃ ') + `Número: `, r));
    rl.close();
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(phoneNumber.replace(/\D/g, ''));
            console.log(chalk.cyan('┃ ') + chalk.bgBlack.white.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join("-") || codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

let messageHandlerMain, messageHandlerSub;
const loadHandlers = async () => {
    try {
        const moduleMain = await import(`file://${join(process.cwd(), 'lib/message.js')}?update=${Date.now()}`);
        messageHandlerMain = moduleMain.message || moduleMain.default;
        const moduleSub = await import(`file://${join(process.cwd(), 'lib/messagesub.js')}?update=${Date.now()}`);
        messageHandlerSub = moduleSub.message || moduleSub.default;
    } catch (e) { console.error(e); }
};
await loadHandlers();
watch(join(process.cwd(), 'lib/message.js'), loadHandlers);
watch(join(process.cwd(), 'lib/messagesub.js'), loadHandlers);

global.reload = async function(restatConn) {
    if (restatConn) { try { global.conn.ws.close(); } catch {} global.conn = makeWASocket(connectionOptions); }
    global.conn.ev.removeAllListeners('messages.upsert');
    global.conn.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        try {
            const m = await smsg(conn, msg);
            if (messageHandlerMain) await messageHandlerMain.call(conn, m, { messages });
            if (m?.isGroup && !global.groupCache.has(m.chat)) {
                const metadata = await conn.groupMetadata(m.chat).catch(() => null);
                if (metadata) global.groupCache.set(m.chat, metadata);
            }
        } catch (e) { if (!e.message?.includes('decrypt')) console.error(e); }
    });

    global.conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut || reason === 403) {
                exec(`rm -rf ${sessionPath}/*`); process.exit(1);
            } else { setTimeout(() => global.reload(true), 10000); }
        }
        if (connection === 'open') {
            global.botNumber = sId(conn.user.id);
            console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
            console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
            const groups = await conn.groupFetchAllParticipating().catch(() => ({}));
            for (const id in groups) global.groupCache.set(id, groups[id]);
            if (global.SubBotSettings) (await global.SubBotSettings.find({ status: true })).forEach(s => global.subbotConfig[s.botId] = s);

            if (global.db) {
                global.db.collection('reports').watch().on('change', async (change) => {
                    if (change.operationType === 'insert') {
                        const data = change.fullDocument;
                        const reportMsg = `┏━━ 「 REPORTE 」 ━━┓\n┃ Sub-Bot: ${data.subBotName}\n┃ Usuario: @${data.sender.split('@')[0]}\n┗━━━━━━━━━━━━━━┛`;
                        await conn.sendMessage('120363424997886266@g.us', { text: reportMsg, mentions: [data.sender] });
                        await global.db.collection('reports').deleteOne({ _id: data._id });
                    }
                });
            }
            setTimeout(async () => { const { loadSubBots } = await import('./lib/serbot.js'); await loadSubBots(global.conn); }, 1000);
        }
    });

    global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();
global.plugins = new Map(); global.aliases = new Map();
async function readRecursive(folder) {
    for (let filename of await fsP.readdir(folder)) {
        const file = join(folder, filename);
        if ((await fsP.stat(file)).isDirectory()) await readRecursive(file);
        else if (filename.endsWith('.js')) {
            const plugin = (await import(`file://${file}`)).default;
            global.plugins.set(plugin.name || basename(filename, '.js'), plugin);
            if (plugin.alias) (Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias]).forEach(a => global.aliases.set(a, plugin.name || basename(filename, '.js')));
        }
    }
}
await readRecursive(join(process.cwd(), './plugins'));

global.subHandler = async (...args) => messageHandlerSub?.call(...args);
