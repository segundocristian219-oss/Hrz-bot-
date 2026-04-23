import 'dotenv/config';
process.removeAllListeners('warning');

const maskLogs = (chunk, encoding, callback, originalWrite) => {
    const msg = chunk?.toString?.() || '';
    if (
        msg.includes('Closing session') || 
        msg.includes('Removing old closed session') || 
        msg.includes('Bad MAC') || 
        msg.includes('Failed to decrypt')
    ) {
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

import './config.js';
import mongoose from 'mongoose';
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
import { smsg } from './lib/serializer.js';
import { EventEmitter } from 'events';
import { LocalDB } from './lib/localDB.js';
import { exec } from "child_process";
import { cacheManager } from './lib/cache.js';

global.groupCache = cacheManager.cache; 
EventEmitter.defaultMaxListeners = 0;

const sId = (jid) => {
    if (!jid) return jid;
    return jid.includes('@') ? jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' : jid.split(':')[0] + '@s.whatsapp.net';
};

global.subbotConfig = {};

process.on('uncaughtException', (err) => {
    const msg = err?.message || '';
    if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed') || msg.includes('decrypt')) return;
    console.error('⚠️ ERROR NO CONTROLADO:', err);
});

process.on('unhandledRejection', (reason) => {
    const msg = String(reason?.message || reason || '');
    if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed') || msg.includes('decrypt')) return;
    console.error('⚠️ PROMESA NO CONTROLADA:', reason);
});

const silentLogger = pino({ 
    level: 'silent',
    base: null,
    serializers: { err: () => {}, res: () => {}, req: () => {} }
});

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);

const originalError = console.error;
console.error = (...args) => originalError.apply(console, [chalk.red('┗'), ...args]);

const dbUrl = process.env.MONGODB_URL;

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

const modelSafely = (name, schema) => {
    try {
        return mongoose.models[name] || mongoose.model(name, schema);
    } catch (e) {
        return mongoose.model(name);
    }
};

if (dbUrl && !process.argv.includes('--local')) {
    mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 5000,
        family: 4
    }).then(async () => {
        logDB('CLOUD', 'CONNECTED');
        global.db = mongoose.connection.db;
        const res1 = await global.db.collection('users').deleteMany({
            $and: [
                { id: { $not: /@s\.whatsapp\.net$/ } },
                { lid: { $not: /@lid$/ } }
            ]
        });
        const res2 = await global.db.collection('users').deleteMany({ id: "", lid: "" });
        if (res1.deletedCount > 0 || res2.deletedCount > 0) {
            console.log(chalk.cyan('┃ ') + `Purga realizada.`);
        }
    }).catch(() => {
        logDB('CLOUD', 'ERROR');
        activateLocalDB();
    });

    const userSchema = new mongoose.Schema({ id: { type: String, unique: true }, lastSeen: { type: Date, default: Date.now } }, { strict: false });
    global.User = modelSafely('User', userSchema);

    const chatSchema = new mongoose.Schema({ id: { type: String, unique: true }, isBanned: { type: Boolean, default: false } }, { strict: false });
    global.Chat = modelSafely('Chat', chatSchema);

    const warnSchema = new mongoose.Schema({ userId: { type: String, required: true }, groupId: { type: String, required: true }, reasons: { type: [String], default: [] }, warnCount: { type: Number, default: 0 }, date: { type: Date, default: Date.now } });
    warnSchema.index({ userId: 1, groupId: 1 }, { unique: true });
    global.Warns = modelSafely('Warns', warnSchema);

    const newsSchema = new mongoose.Schema({ title: { type: String, required: true }, description: { type: String, required: true }, command: { type: String, default: null }, date: { type: Date, default: Date.now } }, { strict: false });
    global.News = modelSafely('News', newsSchema);

    const subBotSettingsSchema = new mongoose.Schema({
        botId: { type: String, unique: true },
        prefix: { type: String, default: '.' },
        botName: { type: String, default: 'Bot - SubBot' },
        botImage: { type: String, default: '' },
        status: { type: Boolean, default: true }
    }, { strict: false });
    global.SubBotSettings = modelSafely('SubBotSettings', subBotSettingsSchema);

    const statsSchema = new mongoose.Schema({ command: { type: String, unique: true }, globalUsage: { type: Number, default: 0 }, groups: { type: Map, of: Number, default: {} } }, { strict: false });
    global.Stats = modelSafely('Stats', statsSchema);
} else {
    activateLocalDB();
}

const { 
    makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, Browsers
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
  defaultQueryTimeoutMs: 60000, 
  keepAliveIntervalMs: 15000,
  emitOwnEvents: true,
  getMessage: async (key) => { return undefined; },
  patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(message.interactiveMessage || message.templateMessage || message.listMessage);
      if (requiresPatch) {
          message = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
      }
      return message;
  }
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
        const rootPath = './sessions';
        if (!existsSync(rootPath)) return;
        const removeOldFiles = async (dir) => {
            const items = await fsP.readdir(dir);
            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = await fsP.stat(fullPath);
                if (stat.isDirectory()) await removeOldFiles(fullPath);
                else if (item !== 'creds.json' && (Date.now() - stat.mtimeMs > 2 * 24 * 60 * 60 * 1000)) {
                    await fsP.unlink(fullPath).catch(() => null);
                }
            }
        };
        await removeOldFiles(rootPath);
    } catch (e) {}
};

let messageHandlerMain;
let messageHandlerSub;

const loadHandlers = async () => {
    try {
        const PathMain = path.join(process.cwd(), 'lib/message.js');
        const PathSub = path.join(process.cwd(), 'lib/messagesub.js');
        const moduleMain = await import(`file://${PathMain}?update=${Date.now()}`);
        messageHandlerMain = moduleMain.message || moduleMain.default?.message || moduleMain.default;
        const moduleSub = await import(`file://${PathSub}?update=${Date.now()}`);
        messageHandlerSub = moduleSub.message || moduleSub.default?.message || moduleSub.default;
    } catch (e) { console.error(e); }
};

await loadHandlers();
watch(path.join(process.cwd(), 'lib/message.js'), loadHandlers);
watch(path.join(process.cwd(), 'lib/messagesub.js'), loadHandlers);

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
        if (messageHandlerMain) await messageHandlerMain.call(conn, m, chatUpdate);
    } catch (e) { if (!e.message?.includes('decrypt')) console.error(e); }
  });

  global.conn.ev.removeAllListeners('connection.update');
  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
        if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
        if (reason === DisconnectReason.loggedOut || reason === 403) { 
            console.error(chalk.red(`┃ STATUS: SESIÓN INVALIDADA`));
            exec(`rm -rf ${sessionPath}/*`);
            process.exit(1);
        } else if (reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
            setTimeout(() => global.reload(true), 10000); 
        } else {
            setTimeout(() => global.reload(true), 15000); 
        }
    }

    if (connection === 'open') {
        global.botNumber = sId(conn.user.id);
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        await cleanSessions();
        const groups = await conn.groupFetchAllParticipating().catch(() => ({}));
        for (const id in groups) {
            cacheManager.updateParticipants(id, groups[id].participants);
            global.groupCache.set(id, groups[id]);
        }
        if (global.SubBotSettings) {
            const allSettings = await global.SubBotSettings.find({ status: true });
            allSettings.forEach(s => {
                global.subbotConfig[s.botId] = s;
            });
        }
        const db = mongoose.connection.db;
        if (db) {
            const reportsCollection = db.collection('reports');
            const devGroupId = 'ID_DEL_GRUPO_DE_SOPORTE'; 
            reportsCollection.watch().on('change', async (change) => {
                if (change.operationType === 'insert') {
                    const data = change.fullDocument;
                    let reportMsg = `┏━━ 「 NUEVO REPORTE 」 ━━┓\n┃ ⊛ Usuario: @${data.sender.split('@')[0]}\n┃ ⊛ Mensaje: ${data.message}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
                    const opt = { 
                        mentions: [data.sender],
                        contextInfo: {
                            mentionedJid: [data.sender],
                            externalAdReply: {
                                title: `SOPORTE TÉCNICO`,
                                body: `Bot System`,
                                mediaType: 1,
                                thumbnailUrl: '',
                                sourceUrl: ''
                            }
                        }
                    };
                    if (data.media) {
                        const buffer = Buffer.from(data.media, 'base64');
                        await conn.sendMessage(devGroupId, { [/image/.test(data.mime) ? 'image' : 'video']: buffer, caption: reportMsg, ...opt });
                    } else {
                        await conn.sendMessage(devGroupId, { text: reportMsg, ...opt });
                    }
                    await reportsCollection.deleteOne({ _id: data._id });
                }
            });
        }
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
                    content: [{ tag: 'status', attrs: {}, content: Buffer.from(`Bot System | ${time}`, 'utf-8') }]
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
        if (update.id) {
            await cacheManager.get(conn, update.id, true).catch(() => null);
        }
    }
  });
  global.conn.ev.on('group-participants.update', async (update) => {
    if (update.id) {
        await cacheManager.get(conn, update.id, true).catch(() => null);
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
        const module = await import(`file://${file}?update=${Date.now()}`);
        const plugin = module.default || module;
        const name = plugin.name || basename(filename, '.js');
        global.plugins.set(name, plugin);
        if (plugin.alias) (Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias]).forEach(a => global.aliases.set(a, name));
      } catch (e) { console.error(e); }
    }
  }
}

global.reloadHandler = async function (check) {
    global.plugins.clear();
    global.aliases.clear();
    await readRecursive(join(process.cwd(), './plugins'));
    if (check) return true;
};

await readRecursive(join(process.cwd(), './plugins'));

global.subHandler = async (...args) => {
    if (messageHandlerSub) return await messageHandlerSub.call(...args);
};
    
