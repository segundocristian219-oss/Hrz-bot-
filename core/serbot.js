import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import {
    makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers,
    jidNormalizedUser,
    jidDecode
} from '@whiskeysockets/baileys';
import useSQLiteAuthState from './auth.js';
import { cacheManager } from './cache.js';
import { observeEvents } from './event/detect.js';
import { initPreview } from '../src/preview-link.js';
import { initButtons } from '../src/buttons.js';
import { initInteractive } from '../src/interactive.js';

global.conns = global.conns || new Map();
global.subbotConfig = global.subbotConfig || {};
global.groupCache = global.groupCache || new Map();

const retryCount = new Map();
const retryTimers = new Map();
const startingLocks = new Set();
const pendingPairings = new Map();
const silentLogger = pino({ level: 'silent' });

let cachedVersion = [2, 3000, 1015970268];
let cachedVersionAt = 0;
const VERSION_REFRESH_MS = 6 * 60 * 60 * 1000;

const MAX_RETRIES = 8;
const BASE_DELAY = 4000;
const MAX_DELAY = 90000;

const PAIRING_GRACE_MS = 90000;
const PAIRING_REQUEST_DELAY_MS = 1200;

const PERMANENT_DISCONNECT_CODES = new Set([
    DisconnectReason.loggedOut,
    403,
]);

const CONDITIONAL_DISCONNECT_CODES = new Set([401, 405]);

const TARGET_CHANNEL = '120363406846602793@newsletter';

const CONNECT_QUEUE = [];
let activeConnects = 0;
const MAX_CONCURRENT_CONNECTS = 5;
const CONNECT_STAGGER_MS = 1200;

function getDbPath(id) {
    return path.join(process.cwd(), 'jadibts', `${id}.sqlite`);
}

function cancelRetry(id) {
    const timer = retryTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        retryTimers.delete(id);
    }
}

function stopCleaner(sock) {
    if (sock?.cleanerInterval) {
        clearInterval(sock.cleanerInterval);
        sock.cleanerInterval = null;
    }
}

function isPairingActive(id) {
    const entry = pendingPairings.get(id);
    return !!entry && Date.now() < entry.deadline;
}

function deleteSession(id, db) {
    cancelRetry(id);
    retryCount.delete(id);
    pendingPairings.delete(id);

    const existing = global.conns.get(id);
    if (existing) {
        stopCleaner(existing);
        try { existing.ws?.close(); } catch (_) { }
        try { existing.end?.(); } catch (_) { }
    }
    global.conns.delete(id);
    startingLocks.delete(id);

    const dbPath = getDbPath(id);
    if (!fs.existsSync(dbPath)) return;
    try {
        if (db) { try { db.close(); } catch (e) { } }
        else if (existing?.db) { try { existing.db.close(); } catch (e) { } }
        fs.unlinkSync(dbPath);
        console.log(chalk.red(`┃ [SUB-BOT] SESIÓN ELIMINADA: ${id}`));
    } catch (e) {
        setTimeout(() => {
            try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch (_) { }
        }, 8000);
    }
}

function scheduleReconnect(id, conn, db) {
    cancelRetry(id);
    startingLocks.delete(id);
    const current = retryCount.get(id) || 0;
    if (current >= MAX_RETRIES) {
        deleteSession(id, db);
        return;
    }
    const jitter = Math.floor(Math.random() * 1500);
    const delay = Math.min(BASE_DELAY * Math.pow(1.8, current), MAX_DELAY) + jitter;
    retryCount.set(id, current + 1);
    const timer = setTimeout(async () => {
        retryTimers.delete(id);
        try {
            await startSubBot(null, conn, id);
        } catch (_) {
            scheduleReconnect(id, conn, db);
        }
    }, delay);
    retryTimers.set(id, timer);
}

async function joinChannels(sock) {
    if (!global.my) return;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            try {
                await delay(2500);
                await sock.newsletterFollow(value);
            } catch (_) { }
        }
    }
}

async function getVersion() {
    const now = Date.now();
    if (now - cachedVersionAt < VERSION_REFRESH_MS) return cachedVersion;
    try {
        const { version } = await fetchLatestBaileysVersion();
        if (Array.isArray(version)) {
            cachedVersion = version;
            cachedVersionAt = now;
        }
    } catch (e) { }
    return cachedVersion;
}

function runNextInQueue() {
    if (activeConnects >= MAX_CONCURRENT_CONNECTS) return;
    const next = CONNECT_QUEUE.shift();
    if (!next) return;
    activeConnects++;
    next().finally(() => {
        activeConnects--;
        setTimeout(runNextInQueue, CONNECT_STAGGER_MS);
    });
    setTimeout(runNextInQueue, 0);
}

function enqueueConnect(fn) {
    return new Promise((resolve, reject) => {
        CONNECT_QUEUE.push(async () => {
            try {
                resolve(await fn());
            } catch (e) {
                reject(e);
            }
        });
        runNextInQueue();
    });
}

setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of pendingPairings.entries()) {
        if (now <= entry.deadline) continue;
        const sock = entry.sock || global.conns.get(id);
        const stillUnregistered = !sock?.authState?.creds?.registered;
        if (sock && stillUnregistered) {
            try {
                stopCleaner(sock);
                sock.ws?.close();
                sock.end?.();
            } catch (_) { }
        }
        if (stillUnregistered) {
            deleteSession(id, sock?.db || null);
        } else {
            pendingPairings.delete(id);
        }
    }
}, 30000);

export async function startSubBot(m, conn, id, { isCode = false, caption = '' } = {}) {
    return enqueueConnect(() => startSubBotInner(m, conn, id, { isCode, caption }));
}

async function startSubBotInner(m, conn, id, { isCode = false, caption = '' } = {}) {
    if (startingLocks.has(id)) return;
    const existing = global.conns.get(id);
    if (existing?.ws?.readyState === 1) return;

    startingLocks.add(id);
    const dir = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const dbPath = getDbPath(id);
    let state, saveCreds, db;
    try {
        ({ state, saveCreds, db } = useSQLiteAuthState(dbPath));
    } catch (e) {
        startingLocks.delete(id);
        return;
    }

    const version = await getVersion();

    let sock;
    try {
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
            },
            logger: silentLogger,
            browser: Browsers.macOS('Chrome'),
            version,
            markOnlineOnConnect: true,
            printQRInTerminal: false,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            shouldIgnoreJid: (jid) => jid?.includes('broadcast') || (jid?.includes('newsletter') && jid !== TARGET_CHANNEL),
            generateHighQualityLinkPreview: false,
            msgRetryCounterCache: new NodeCache({ stdTTL: 900, useClones: false }),
            cachedGroupMetadata: async (jid) => {
                let metadata = global.groupCache.get(jid);
                if (!metadata) {
                    metadata = await sock.groupMetadata(jid).catch(() => null);
                    if (metadata) global.groupCache.set(jid, metadata);
                }
                return metadata;
            },
            defaultQueryTimeoutMs: 20000,
            retryRequestDelayMs: 1500,
            keepAliveIntervalMs: 25000,
            connectTimeoutMs: 25000,
            maxIdleTimeMs: 60000,
            getMessage: async () => undefined,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(message.interactiveMessage || message.templateMessage || message.listMessage);
                if (requiresPatch) {
                    message = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
                }
                return message;
            }
        });
        sock.db = db;
    } catch (e) {
        startingLocks.delete(id);
        try { db.close(); } catch (_) { }
        return;
    }

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decoded = jidDecode(jid) || {};
            return (decoded.user && decoded.server && `${decoded.user}@${decoded.server}`) || jid;
        }
        return jid;
    };

    sock.isSub = true;
    sock.isInit = false;

    const dbCleanerInterval = setInterval(() => {
        try {
            db.prepare("DELETE FROM auth WHERE id LIKE 'pre-key-%'").run();
            db.prepare("DELETE FROM auth WHERE id LIKE 'sender-key-%'").run();
            db.prepare("DELETE FROM auth WHERE id LIKE 'session-%'").run();
        } catch (e) { }
    }, 4 * 60 * 60 * 1000 + Math.floor(Math.random() * 600000));

    const dbVacuumInterval = setInterval(() => {
        try {
            db.prepare('VACUUM').run();
        } catch (e) { }
    }, 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 3600000));

    sock.cleanerInterval = dbCleanerInterval;
    sock.vacuumInterval = dbVacuumInterval;
    sock.ev.on('creds.update', () => { try { saveCreds(); } catch (e) { } });

    let pairingCode = null;
    if (!sock.authState.creds.registered) {
        if (!m?.chat || !id) {
            startingLocks.delete(id);
            stopCleaner(sock);
            clearInterval(sock.vacuumInterval);
            try { db.close(); } catch (_) { }
            return;
        }

        pendingPairings.set(id, { deadline: Date.now() + PAIRING_GRACE_MS, sock });

        try {
            await new Promise(r => setTimeout(r, PAIRING_REQUEST_DELAY_MS));
            const raw = await sock.requestPairingCode(id);
            pairingCode = raw?.match(/.{1,4}/g)?.join('-') || raw;
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
            global.conns.set(id, sock);
            startingLocks.delete(id);

            if (isCode && pairingCode && conn && m) {
                try {
                    const msgCaption = caption ? await conn.sendMessage(m.chat, { text: caption }, { quoted: m }) : null;
                    const msgCode = await conn.sendMessage(m.chat, { text: pairingCode }, { quoted: m });
                    setTimeout(async () => {
                        try {
                            if (msgCaption) await conn.sendMessage(m.chat, { delete: msgCaption.key });
                            await conn.sendMessage(m.chat, { delete: msgCode.key });
                        } catch (e) { }
                    }, 60000);
                } catch (e) { }
            }
        } catch (e) {
            startingLocks.delete(id);
            pendingPairings.delete(id);
            stopCleaner(sock);
            clearInterval(sock.vacuumInterval);
            global.conns.delete(id);
            try { sock.ws?.close(); } catch (_) { }
            try { db.close(); } catch (_) { }
            return null;
        }
    }

    observeEvents(sock);
    initPreview(sock);
    initButtons(sock);
    initInteractive(sock);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            startingLocks.delete(id);
            retryCount.set(id, 0);
            pendingPairings.delete(id);
            cancelRetry(id);
            global.conns.set(id, sock);
            sock.uptime = Date.now();
            let user = id;
            try { user = jidNormalizedUser(sock.user.id); } catch (_) { }
            sock.userId = user.split('@')[0];
            try {
                const antiStatusModule = await import('./event/antiStatus.js');
                if (antiStatusModule?.default) antiStatusModule.default(sock);
            } catch (_) { }
            try {
                let settings = global.subbotConfig[user];
                if (!settings) {
                    settings = await global.SubBotSettings.findOne({ botId: user }).lean();
                    if (!settings) {
                        settings = { botId: user, prefix: '.' };
                        global.SubBotSettings.create(settings).catch(() => null);
                    }
                    global.subbotConfig[user] = settings;
                }
                sock.settings = global.subbotConfig[user];
            } catch (e) {
                sock.settings = { botName: 'Kirito - SubBot', prefix: '.' };
                global.subbotConfig[user] = sock.settings;
            }
            sock.isInit = true;
            await joinChannels(sock).catch(() => { });
            try { await sock.newsletterFollow(TARGET_CHANNEL); } catch (_) { }
            if (sock._pairingChat && sock._pairingUser) {
                try {
                    await sock.sendMessage(sock._pairingChat, {
                        text: `✅ *@${sock._pairingUser.split('@')[0]}*\n\n> Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ.`,
                        mentions: [sock._pairingUser],
                    });
                } catch (_) { }
                delete sock._pairingChat;
                delete sock._pairingUser;
            }
        }

        if (connection === 'close') {
            stopCleaner(sock);
            if (sock.vacuumInterval) {
                clearInterval(sock.vacuumInterval);
                sock.vacuumInterval = null;
            }

            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const errorMessage = (lastDisconnect?.error?.message || '').toLowerCase();
            const explicitLoggedOut = errorMessage.includes('logged out') || errorMessage.includes('unauthorized');

            const wasRegistered = !!sock.authState?.creds?.registered;
            const pairingActive = !wasRegistered && isPairingActive(id);

            const isHardPermanent = PERMANENT_DISCONNECT_CODES.has(statusCode) || explicitLoggedOut;
            const isConditionalPermanent = CONDITIONAL_DISCONNECT_CODES.has(statusCode) && !pairingActive;

            global.conns.delete(id);

            if (pairingActive) {
                startingLocks.delete(id);
                return;
            }

            if (isHardPermanent || isConditionalPermanent) {
                deleteSession(id, db);
                return;
            }

            scheduleReconnect(id, conn, db);
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages || chatUpdate.messages.length === 0 || chatUpdate.type !== 'notify') return;
        try {
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./message.js');
            if (!message) return;

            const now = Date.now();
            const validMessages = [];

            for (const msg of chatUpdate.messages) {
                if (!msg.message && !msg.messageStubType) continue;
                const jid = msg.key.remoteJid;

                if (jid?.endsWith('@newsletter')) {
                    if (jid !== TARGET_CHANNEL) continue;
                    const serverId = msg.key.server_id || msg.key.serverId;
                    if (serverId) {
                        const emojis = ['👍', '😆', '😭', '😺', '🫪'];
                        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        setTimeout(() => {
                            sock.query({
                                tag: 'message',
                                attrs: { to: jid, type: 'reaction', server_id: serverId.toString() },
                                content: [{ tag: 'reaction', attrs: { code: selectedEmoji } }]
                            }).catch(() => { });
                        }, Math.floor(Math.random() * 4000) + 2000);
                    }
                    continue;
                }

                const mTimestamp = (msg.messageTimestamp?.low || msg.messageTimestamp || 0) * 1000;
                if (now - mTimestamp > 15000) continue;
                validMessages.push(msg);
            }

            if (validMessages.length === 0) return;

            await Promise.allSettled(
                validMessages.map(async (msg) => {
                    try {
                        const m = await smsg(sock, msg);
                        if (!m || m.chat?.endsWith('@newsletter')) return;

                        await message.call(sock, m, chatUpdate);
                    } catch (e) {
                        console.error('Error procesando mensaje en subbot:', e);
                    }
                })
            );
        } catch (e) {
            console.error('Error general en messages.upsert:', e);
        }
    });

    sock.ev.on('group-participants.update', async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id).catch(() => null);
            if (metadata) {
                cacheManager.updateParticipants(anu.id, metadata.participants);
                global.groupCache.set(anu.id, metadata);
            }
        } catch (_) { }
    });

    if (pairingCode) return pairingCode;
    return sock;
}

export async function cleanOrphanSessions() {
    const rootPath = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(rootPath)) return;
    const files = fs.readdirSync(rootPath).filter(f => f.endsWith('.sqlite'));
    for (const file of files) {
        const id = file.replace('.sqlite', '');
        if (global.conns.has(id) || startingLocks.has(id) || pendingPairings.has(id)) continue;
        const dbPath = path.join(rootPath, file);
        let isRegistered = false;
        try {
            const { state, db } = useSQLiteAuthState(dbPath);
            isRegistered = !!state?.creds?.registered;
            try { db.close(); } catch (e) { }
        } catch (e) { }
        if (!isRegistered) {
            try { fs.unlinkSync(dbPath); } catch (_) { }
        }
    }
}

export async function loadSubBots(conn) {
    const rootPath = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
        return;
    }
    await cleanOrphanSessions();
    const files = fs.readdirSync(rootPath).filter(f => f.endsWith('.sqlite'));
    const validIds = files.map(f => f.replace('.sqlite', ''));
    if (validIds.length === 0) return;

    await Promise.allSettled(
        validIds.map(async (id) => {
            if (global.conns.has(id) || startingLocks.has(id)) return;
            try { await startSubBot(null, conn, id); } catch (e) { }
        })
    );
}
