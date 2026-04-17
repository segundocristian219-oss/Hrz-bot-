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

const msgRetryCounterCache = new NodeCache();
const userDevicesCache = new NodeCache();
const silentLogger = pino({ level: 'silent' });

export async function startSubBot(m, conn, id) {
    const authFolder = path.join(process.cwd(), 'sessions/jadibts', id);

    let isOnline = global.conns.find(c => jidNormalizedUser(c.user?.id) === jidNormalizedUser(`${id}@s.whatsapp.net`));

    if (isOnline && isOnline.ws.isOpen) {
        if (m) return conn.sendMessage(m.chat, { text: `✅ *CONECTADO*\n\nEL SISTEMA YA SE ENCUENTRA ACTIVO.` }, { quoted: m });
        return;
    }

    if (m && fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
        global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(`${id}@s.whatsapp.net`));
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
        markOnlineOnConnect: false,
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        msgRetryCounterCache,
        userDevicesCache,
        defaultQueryTimeoutMs: 0,
        retryRequestDelayMs: 5000,
        keepAliveIntervalMs: 20000,
        emitOwnEvents: false
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
            await conn.sendMessage(m.chat, { text: formattedCode }, contextInfo: { ...channelInfo }, { quoted: m });
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
        } catch (e) {
            console.error(chalk.red(`[ERROR PAIRING]`), e.message);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            sock.isInit = true;
            const user = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => jidNormalizedUser(c.user?.id) === user)) global.conns.push(sock);
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));

            if (sock._pairingChat && sock._pairingUser) {
                await sock.sendMessage(sock._pairingChat, {
                    text: `✅ Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ.`,
                    mentions: [sock._pairingUser]
                });
                delete sock._pairingChat;
                delete sock._pairingUser;
            }

            try {
                await sock.newsletterFollow('120363406846602793@newsletter');
            } catch (e) {}

            const files = fs.readdirSync(authFolder);
            for (const file of files) {
                if (file !== 'creds.json') {
                    const fPath = path.join(authFolder, file);
                    try {
                        if (Date.now() - fs.statSync(fPath).mtimeMs > 600000) fs.unlinkSync(fPath);
                    } catch (e) {}
                }
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut || reason === 401) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(sock.user?.id));
                console.log(chalk.red(`┃ [SUB-BOT] SESIÓN ELIMINADA: ${id}`));
            } else {
                setTimeout(() => startSubBot(null, conn, id), 15000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./message.js');
            for (let msg of chatUpdate.messages) {
                if (!msg.message) continue;
                const jid = msg.key.remoteJid;
                if (jid && jid.endsWith('@newsletter')) {
                    const serverId = msg.key.server_id || msg.key.serverId;
                    if (serverId) {
                        const emojis = ['👍', '😆', '😭', '😺', '🫪'];
                        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        try {
                            setTimeout(async () => {
                                await sock.query({
                                    tag: 'message',
                                    attrs: { to: jid, type: 'reaction', server_id: serverId.toString() },
                                    content: [{
                                        tag: 'reaction',
                                        attrs: { code: selectedEmoji }
                                    }]
                                }).catch(() => {});
                            }, Math.floor(Math.random() * 3000) + 1000);
                        } catch (e) {}
                    }
                }
                if (msg.key.remoteJid === 'status@broadcast') continue;
                let m = await smsg(sock, msg);
                await message.call(sock, m, chatUpdate);
            }
        } catch (e) {}
    });

    return sock;
}

export async function loadSubBots(conn) {
    const rootPath = path.join(process.cwd(), 'sessions/jadibts');
    if (!fs.existsSync(rootPath)) return;
    const folders = fs.readdirSync(rootPath).filter(id => fs.existsSync(path.join(rootPath, id, 'creds.json')));
    
    for (let i = 0; i < folders.length; i += 5) {
        const chunk = folders.slice(i, i + 5);
        setTimeout(() => {
            chunk.forEach(id => startSubBot(null, conn, id));
        }, (i / 5) * 5000);
    }
}
