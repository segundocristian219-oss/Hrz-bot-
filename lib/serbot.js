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
    useMultiFileAuthState,
    jidNormalizedUser,
    jidDecode
} from '@whiskeysockets/baileys';

if (!global.conns) global.conns = [];
const retryCount = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, useClones: false });
const userDevicesCache = new NodeCache({ stdTTL: 3600, useClones: false });
const silentLogger = pino({ level: 'silent' });

export async function startSubBot(m, conn, id) {
    const authFolder = path.join(process.cwd(), 'jadibts', id);

    let isOnline = global.conns.find(c => c.user && jidNormalizedUser(c.user.id) === jidNormalizedUser(`${id}@s.whatsapp.net`));

    if (isOnline && isOnline.ws.isOpen) {
        if (m) return conn.sendMessage(m.chat, { text: `✅ *CONECTADO*\n\nEL SISTEMA YA SE ENCUENTRA ACTIVO.` }, { quoted: m });
        return;
    }

    if (m && fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
        global.conns = global.conns.filter(c => c.user && jidNormalizedUser(c.user.id) !== jidNormalizedUser(`${id}@s.whatsapp.net`));
    }

    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        logger: silentLogger,
        browser: Browsers.macOS("Chrome"),
        version,
        markOnlineOnConnect: true,
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache,
        userDevicesCache,
        defaultQueryTimeoutMs: undefined,
        retryRequestDelayMs: 3000,
        keepAliveIntervalMs: 30000
    });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };

    sock.isSub = true;
    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        if (!m || !id) return;
        try {
            await new Promise(r => setTimeout(r, 6000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            await conn.sendMessage(m.chat, { text: `\n\n\t\t\t\t${formattedCode}\n\n\t`, contextInfo: { ...global.channelInfo } }, { quoted: m });
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
        } catch (e) {
            console.error(chalk.red(`[ERROR PAIRING]`), e.message);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (lastDisconnect?.error) {
            const code = new Boom(lastDisconnect.error)?.output?.statusCode;
            const message = lastDisconnect.error.message || '';
            if (code === 428 || code === 403 || message.includes('MessageCounterError') || message.includes('Key used already')) {
                console.log(chalk.red(`┃ [AUTO-PURGA] Sesión corrupta: ${id}. Eliminando...`));
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => c.user && jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user?.id));
                return;
            }
        }

        if (connection === 'open') {
            const user = jidNormalizedUser(sock.user.id);
            try {
                let settings = await global.SubBotSettings.findOne({ botId: user });
                if (!settings) {
                    settings = await global.SubBotSettings.create({ 
                        botId: user,
                        botName: 'Kirito - SubBot',
                        botImage: 'https://api.dix.lat/media2/1773637281084.jpg',
                        prefix: '.'
                    });
                }
                if (!global.subbotConfig) global.subbotConfig = {};
                global.subbotConfig[user] = settings;
                sock.settings = settings; 
            } catch (e) {
                sock.settings = { botName: 'Kirito - SubBot', prefix: '.', botImage: 'https://api.dix.lat/media2/1773637281084.jpg' };
            }
            sock.isInit = true;
            retryCount.set(id, 0);
            if (!global.conns.some(c => c.user && jidNormalizedUser(c.user.id) === user)) global.conns.push(sock);
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));
            if (sock._pairingChat && sock._pairingUser) {
                await sock.sendMessage(sock._pairingChat, { text: `✅ *@${sock._pairingUser.split('@')[0]}*\n\n> Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ.`, mentions: [sock._pairingUser] });
                delete sock._pairingChat; delete sock._pairingUser;
            }
            try { await sock.newsletterFollow('120363406846602793@newsletter'); } catch (e) {}
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const currentRetries = retryCount.get(id) || 0;
            if (reason === DisconnectReason.loggedOut || reason === 401 || currentRetries >= 2) {
                console.log(chalk.red(`┃ [SUB-BOT] SESIÓN FINALIZADA: ${id}`));
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => c.user && jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user?.id));
                retryCount.delete(id);
            } else {
                retryCount.set(id, currentRetries + 1);
                setTimeout(() => startSubBot(null, conn, id), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./messagesub.js');
            
            await Promise.all(chatUpdate.messages.map(async (msg) => {
                if (!msg.message) return;
                const jid = msg.key.remoteJid;
                if (jid && jid.endsWith('@newsletter')) {
                    const serverId = msg.key.server_id || msg.key.serverId;
                    if (serverId) {
                        const emojis = ['👍', '😆', '😭', '😺', '🫪'];
                        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        setTimeout(() => {
                            sock.query({ tag: 'message', attrs: { to: jid, type: 'reaction', server_id: serverId.toString() }, content: [{ tag: 'reaction', attrs: { code: selectedEmoji } }] }).catch(() => {});
                        }, Math.floor(Math.random() * 3000) + 1000);
                    }
                }
                let m = await smsg(sock, msg);
                if (message) await message.call(sock, m, chatUpdate).catch(e => console.error(e));
            }));
        } catch (e) { console.error(e); }
    });
    return sock;
}

export async function loadSubBots(conn) {
    const rootPath = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(rootPath)) return;
    
    const folders = fs.readdirSync(rootPath);
    const validIds = [];

    console.log(chalk.blue(`┃ [SISTEMA] Iniciando purga y carga en paralelo...`));
    
    for (const id of folders) {
        const folderPath = path.join(rootPath, id);
        if (!fs.existsSync(path.join(folderPath, 'creds.json'))) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        } else {
            validIds.push(id);
        }
    }

    await Promise.allSettled(validIds.map(async (id) => {
        const jid = `${id}@s.whatsapp.net`;
        if (global.conns.some(c => c.user && jidNormalizedUser(c.user.id) === jidNormalizedUser(jid))) return;
        return startSubBot(null, conn, id);
    }));
}
