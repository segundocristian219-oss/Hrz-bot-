import './src/config/index.js';
import 'dotenv/config';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join, basename } from 'path';
import fs, { existsSync, mkdirSync, watch, promises as fsP } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import yargs from 'yargs';
import { Boom } from '@hapi/boom';
import { makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, useMultiFileAuthState } from '@whiskeysockets/baileys';

import { smsg } from './core/serializer.js';
import { cacheManager } from './core/cache.js';
import { observeEvents } from './core/event/detect.js';
import { initPreview } from './src/preview-link.js';
import { initButtons } from './src/buttons.js';
import { initInteractive } from './src/interactive.js';

import { databaseManager } from './database/db_adapter.js';

const FILTERED_LOGS = [
    'Closing session',
    'Removing old closed session',
    'Closing open session in favor of incoming prekey bundle',
    'Bad MAC',
    'Failed to decrypt message with any known session',
    'MessageCounterError',
    'Decrypted message with closed session',
    'Session error',
    'Connection Closed',
    'Connection Failure',
    'connect ECONNREFUSED',
    'socket hang up',
    'ECONNRESET',
];

const startingLocks = new Set();

const maskLogs = (chunk, encoding, callback, originalWrite) => {
    const msg = chunk?.toString?.() || '';
    if (FILTERED_LOGS.some(f => msg.includes(f))) {
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

process.removeAllListeners('warning');
process.setMaxListeners(0);

global.groupCache = cacheManager.cache;
global.conns = new Map();

const sId = (jid) => {
    if (!jid) return jid;
    const index = jid.indexOf('@');
    if (index !== -1) {
        const user = jid.slice(0, index);
        const splitCol = user.indexOf(':');
        return (splitCol !== -1 ? user.slice(0, splitCol) : user) + '@s.whatsapp.net';
    }
    const splitCol = jid.indexOf(':');
    return (splitCol !== -1 ? jid.slice(0, splitCol) : jid) + '@s.whatsapp.net';
};

global.subbotConfig = {};
global.userCache = new Map();
global.dirtyUsers = new Set();

global.updateUser = (jid, data) => {
    const currentData = global.userCache.get(jid) || {};
    const updatedData = { ...currentData, ...data, id: jid, lastActive: Date.now() };
    global.userCache.set(jid, updatedData);
    global.dirtyUsers.add(jid);
    return updatedData;
};

global.updateSubBotSettings = (botId, data) => {
    const current = global.subbotConfig[botId] || {};
    global.subbotConfig[botId] = { ...current, ...data, botId };
    return global.subbotConfig[botId];
};

let _flushing = false;
const flushData = async () => {
    if (_flushing) return;
    _flushing = true;
    if (global.dirtyUsers.size > 0) {
        const usersToSave = Array.from(global.dirtyUsers);
        global.dirtyUsers.clear();
        const dataArray = usersToSave.map(jid => global.userCache.get(jid)).filter(Boolean);
        try {
            if (dataArray.length > 0) await databaseManager.saveUsersBulk(dataArray);
        } catch (_) {}
    }
    process.exit(0);
};

process.on('SIGINT', flushData);
process.on('SIGTERM', flushData);

process.on('uncaughtException', (err) => {
    const msg = err?.message || '';
    if (FILTERED_LOGS.some(f => msg.includes(f))) return;
    console.error('[uncaughtException]', err?.stack || err);
});

process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    if (FILTERED_LOGS.some(f => msg.includes(f))) return;
    console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : msg);
});

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);
const originalError = console.error;
console.error = (...args) => {
    args.forEach(arg => {
        if (arg instanceof Error) originalError.apply(console, [chalk.red('┗ ERROR:'), arg.stack]);
        else originalError.apply(console, [chalk.red('┗'), arg]);
    });
};

console.clear();
cfonts.say('KIRITO', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });

if (!existsSync('./database')) mkdirSync('./database', { recursive: true });

await databaseManager.init();

global.restrictionsCache = new Map();

async function loadBotRestrictions(botId) {
    if (global.restrictionsCache.has(botId)) return global.restrictionsCache.get(botId);
    try {
        const settings = await databaseManager.getBotRestrictions(botId);
        if (settings) {
            const data = { restrictedMode: settings.restrictedMode, hiddenCommands: new Set(settings.hiddenCommands) };
            global.restrictionsCache.set(botId, data);
            return data;
        }
    } catch (_) {}
    const fallback = { restrictedMode: false, hiddenCommands: new Set() };
    global.restrictionsCache.set(botId, fallback);
    return fallback;
}

global.updateBotRestrictions = async (botId, update) => {
    try {
        const settings = await databaseManager.updateBotRestrictions(botId, update);
        if (settings) {
            global.restrictionsCache.set(botId, {
                restrictedMode: settings.restrictedMode,
                hiddenCommands: new Set(settings.hiddenCommands)
            });
            return true;
        }
    } catch (_) {}
    return false;
};

global.isCommandAllowed = (sock, command) => {
    if (!sock?.user) return true;
    const botId = sId(sock.user.id);
    if (!global.restrictionsCache.has(botId)) {
        loadBotRestrictions(botId).catch(() => {});
        return true;
    }
    const cache = global.restrictionsCache.get(botId);
    if (cache?.restrictedMode && cache.hiddenCommands.has(command)) return false;
    return true;
};

let _isSavingDB = false;
setInterval(async () => {
    const sweepCache = () => {
        if (global.userCache.size > 2000) {
            const now = Date.now();
            for (const [jid, data] of global.userCache.entries()) {
                if (now - (data.lastActive || 0) > 3600000 && !global.dirtyUsers.has(jid)) {
                    global.userCache.delete(jid);
                }
            }
        }
    };
    if (global.dirtyUsers.size === 0) { sweepCache(); return; }
    if (_isSavingDB) return;
    _isSavingDB = true;
    const usersToSave = Array.from(global.dirtyUsers);
    global.dirtyUsers.clear();
    const dataArray = usersToSave.map(jid => global.userCache.get(jid)).filter(Boolean);
    try {
        if (dataArray.length > 0) await databaseManager.saveUsersBulk(dataArray);
        sweepCache();
    } catch (_) {
        usersToSave.forEach(jid => global.dirtyUsers.add(jid));
    } finally {
        _isSavingDB = false;
    }
}, 15000);

if (!existsSync('./tmp')) mkdirSync('./tmp');
if (!existsSync('./sessions')) mkdirSync('./sessions');

const sessionDir = './sessions/main';

const cleanDeviceList = async (maxFiles = 500) => {
    try {
        const files = await fsP.readdir(sessionDir);
        const deviceFiles = files.filter(f => f.startsWith('device-list-'));
        if (deviceFiles.length <= maxFiles) return;
        const withStats = await Promise.all(
            deviceFiles.map(async f => {
                const fp = path.join(sessionDir, f);
                const stat = await fsP.stat(fp).catch(() => null);
                return { path: fp, mtime: stat?.mtimeMs || 0 };
            })
        );
        withStats.sort((a, b) => a.mtime - b.mtime);
        const toDelete = withStats.slice(0, withStats.length - maxFiles);
        await Promise.all(toDelete.map(f => fsP.unlink(f.path).catch(() => {})));
    } catch (_) {}
};

await cleanDeviceList();
setInterval(cleanDeviceList, 6 * 60 * 60 * 1000);

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') =>
    rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathURL;
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true));

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const isSockAlive = (sock) => sock?.ws?.readyState === 1;

const connectionOptions = {
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    markOnlineOnConnect: true,
    syncFullHistory: false,
    msgRetryCounterCache,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 20000,
    emitOwnEvents: true,
    getMessage: async () => undefined
};

global.conn = makeWASocket(connectionOptions);
initPreview(global.conn);
initButtons(global.conn);
initInteractive(global.conn);
global.conn.ev.on('creds.update', saveCreds);
global.conn.isMain = true;
global.conns.set('main', global.conn);
global._reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000;
let _reconnectTimer = null;
let _isReconnecting = false;

function getReconnectDelay() {
    const delay = Math.min(10000 * (global._reconnectAttempts + 1), MAX_RECONNECT_DELAY);
    global._reconnectAttempts++;
    return delay;
}

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + 'Número: ');
    let addNumber = phoneNumber.replace(/\D/g, '');
    rl.close();
    setTimeout(async () => {
        try {
            let codeBot = await global.conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.bgBlack.white.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join('-') || codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

let messageHandlerMain;

const loadCoreRouter = async () => {
    try {
        const PathMain = path.join(process.cwd(), 'core/message.js');
        const moduleMain = await import(`file://${PathMain}?update=${Date.now()}`);
        messageHandlerMain = moduleMain.message || moduleMain.default?.message || moduleMain.default;
    } catch (e) { console.error(e); }
};

await loadCoreRouter();
watch(path.join(process.cwd(), 'core/message.js'), loadCoreRouter);

global.reload = async function (restatConn) {
    if (startingLocks.has('main')) return;
    if (_isReconnecting && restatConn) return;
    if (restatConn) {
        startingLocks.add('main');
        _isReconnecting = true;
        if (global.keepAlive) { clearInterval(global.keepAlive); global.keepAlive = null; }
        if (global.presenceIntervalMain) { clearInterval(global.presenceIntervalMain); global.presenceIntervalMain = null; }
        try {
            if (global.conn?.ev) {
                global.conn.ev.removeAllListeners('messages.upsert');
                global.conn.ev.removeAllListeners('connection.update');
                global.conn.ev.removeAllListeners('groups.update');
            }
            global.conn.ws?.close();
        } catch (_) {}
        try { global.conn.end(new Error('Reconnection Execution')); } catch (_) {}
        await new Promise(r => setTimeout(r, 1000));
        await cleanDeviceList(200);
        await new Promise(r => setTimeout(r, 500));
        const { state: newState, saveCreds: newSaveCreds } = await useMultiFileAuthState(sessionDir);
        global.conn = makeWASocket({
            ...connectionOptions,
            auth: {
                creds: newState.creds,
                keys: makeCacheableSignalKeyStore(newState.keys, pino({ level: 'silent' })),
            }
        });
        initPreview(global.conn);
        initButtons(global.conn);
        initInteractive(global.conn);
        global.conn.ev.on('creds.update', newSaveCreds);
        global.conn.isMain = true;
        global.conns.set('main', global.conn);
        _isReconnecting = false;
        startingLocks.delete('main');
    }

    global.conn.ev.removeAllListeners('messages.upsert');
    observeEvents(global.conn);
    global.conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return;
        const msg = chatUpdate.messages[0];
        Promise.resolve().then(async () => {
            try {
                const m = await smsg(global.conn, msg);
                if (!m) return;
                if (typeof messageHandlerMain === 'function') {
                    await messageHandlerMain.call(global.conn, m, chatUpdate);
                }
            } catch (e) {
                const em = e?.message || '';
                if (!FILTERED_LOGS.some(f => em.includes(f))) console.error('[messages.upsert]', e);
            }
        });
    });

    global.conn.ev.removeAllListeners('connection.update');
    global.conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
            console.error(chalk.yellow(`┃ DESCONECTADO (código ${reason})`));
            if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
            const delay = getReconnectDelay();
            console.log(chalk.cyan(`┃ Reintento #${global._reconnectAttempts} en ${delay / 1000}s...`));
            _reconnectTimer = setTimeout(() => { _reconnectTimer = null; global.reload(true); }, delay);
        }
        if (connection === 'open') {
            if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
            _isReconnecting = false;
            global._reconnectAttempts = 0;
            global.botNumber = sId(global.conn.user.id);
            console.log(chalk.cyan('┃ ') + chalk.greenBright.bold('STATUS: ONLINE'));
            console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

            try {
                const groups = await global.conn.groupFetchAllParticipating().catch(() => ({}));
                for (const id in groups) {
                    cacheManager.updateParticipants(id, groups[id].participants);
                    global.groupCache.set(id, groups[id]);
                }
            } catch (_) {}

            try {
                const allSettings = await databaseManager.getActiveSubBots();
                allSettings.forEach(s => { global.subbotConfig[s.botId] = s; });
            } catch (_) {}

            setTimeout(async () => {
                try {
                    const { loadSubBots } = await import('./core/serbot.js');
                    await loadSubBots(global.conn);
                } catch (e) { console.error('Error al cargar subbots:', e); }
            }, 3000);

            const updateStatus = async () => {
                if (!isSockAlive(global.conn)) return;
                try {
                    const time = new Date().toLocaleString('es-HN', { hour12: true });
                    await global.conn.query({
                        tag: 'iq',
                        attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                        content: [{ tag: 'status', attrs: {}, content: Buffer.from(`KIRITO BOT MD | ${time}`, 'utf-8') }]
                    });
                } catch (_) {}
            };
            updateStatus();
            if (global.keepAlive) clearInterval(global.keepAlive);
            global.keepAlive = setInterval(updateStatus, 600000);
            if (!isSockAlive(global.conn)) return;
            await global.conn.sendPresenceUpdate('available').catch(() => null);
            if (global.presenceIntervalMain) clearInterval(global.presenceIntervalMain);
            global.presenceIntervalMain = setInterval(async () => {
                if (!isSockAlive(global.conn)) return;
                await global.conn.sendPresenceUpdate('available').catch(() => null);
            }, 20000);
        }
    });

    global.conn.ev.removeAllListeners('groups.update');
    global.conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (!update?.id) continue;
            try {
                const metadata = await global.conn.groupMetadata(update.id).catch(() => null);
                if (metadata) {
                    global.groupCache.set(update.id, metadata);
                    cacheManager.updateParticipants(update.id, metadata.participants);
                }
            } catch (_) {}
        }
    });
};

await global.reload();

global.modules = new Map();
global.commands = new Map();
global.aliases = new Map();

const getFilesRecursive = (dir) => {
    let results = [];
    if (!existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursive(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    }
    return results;
};

global.reloadModules = async function (check) {
    global.modules.clear();
    global.commands.clear();
    global.aliases.clear();

    const modulesDir = join(process.cwd(), './modules');
    if (!existsSync(modulesDir)) return false;

    const files = getFilesRecursive(modulesDir);
    for (const filePath of files) {
        try {
            const fileUrl = pathToFileURL(filePath).href;
            const imported = await import(`${fileUrl}?update=${Date.now()}`);
            const mod = imported.default || imported;

            for (const key in mod) {
                const possibleGroup = mod[key];
                if (possibleGroup && possibleGroup.commands) {
                    const moduleName = basename(filePath, '.js');
                    global.modules.set(moduleName, possibleGroup);
                    for (const cmdKey in possibleGroup.commands) {
                        const cmd = possibleGroup.commands[cmdKey];
                        cmd.category = possibleGroup.category || 'general';
                        global.commands.set(cmd.name, cmd);
                        if (cmd.alias && Array.isArray(cmd.alias)) {
                            cmd.alias.forEach(a => global.aliases.set(a, cmd.name));
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[module-load]', filePath, e.message);
        }
    }
    if (check) return true;
};

await global.reloadModules();
