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
        retryRequestDelayMs: 5000,
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
            await new Promise(r => setTimeout(r, 4000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

                        await conn.sendMessage(m.chat, { 
                text: formattedCode,
                contextInfo: {
                    externalAdReply: {
                        title: "KIRITO BOT - VINCULACIÓN",
                        body: "Víncula tu dispositivo ahora",
                        sourceUrl: "https://dix.lat",
                        thumbnailUrl: img(), 
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

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
                    text: `✅ *@${sock._pairingUser.split('@')[0]}*\n\n> Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ.`,
                    mentions: [sock._pairingUser]
                });
                delete sock._pairingChat;
                delete sock._pairingUser;
            }

            const files = fs.readdirSync(authFolder);
            for (const file of files) {
                if (file !== 'creds.json' && (file.includes('pre-key') || file.includes('sender-key') || file.includes('session-'))) {
                    const fPath = path.join(authFolder, file);
                    if (Date.now() - fs.statSync(fPath).mtimeMs > 86400000) fs.unlinkSync(fPath);
                }
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || '';

            if (reason === DisconnectReason.loggedOut || reason === 401 || errorMsg.includes('Bad MAC')) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(sock.user?.id));
                console.log(chalk.red(`┃ [SUB-BOT] SESIÓN ELIMINADA: ${id}`));
            } else {
                const delay = Math.floor(Math.random() * 5000) + 5000;
                setTimeout(() => startSubBot(null, null, id), delay);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./message.js');
            for (let msg of chatUpdate.messages) {
                if (!msg.message) continue;
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
    const folders = fs.readdirSync(rootPath);
    for (const id of folders) {
        if (fs.existsSync(path.join(rootPath, id, 'creds.json'))) {
            try {
                await startSubBot(null, conn, id);
                await new Promise(r => setTimeout(r, 2000));
            } catch {}
        }
    }
}
