import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { 
    makeWASocket, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion, 
    Browsers, 
    useMultiFileAuthState,
    jidNormalizedUser
} from '@whiskeysockets/baileys';

if (!global.conns) global.conns = [];

const silentLogger = pino({ 
    level: 'silent',
    base: null,
    serializers: {
        err: () => {},
        res: () => {},
        req: () => {}
    }
});

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
        browser: Browsers.ubuntu("Chrome"),
        version,
        markOnlineOnConnect: true,
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        retryRequestDelayMs: 5000,
        maxMsgRetryCount: 5
    });

    sock.isSub = true;
    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        if (!m || !id) {
            if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
            return;
        }
        try {
            await new Promise(r => setTimeout(r, 2000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

            await conn.sendMessage(m.chat, { 
                text: formattedCode,
                contextInfo: {
                    externalAdReply: {
                        title: "KIRITO BOT",
                        body: "Usa el código para vincular tu dispositivo",
                        sourceUrl: "https://dix.lat",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
        } catch (e) {
            if (!e.message.includes('unavailable')) console.error(chalk.red(`[SERBOT ERROR]`), e.message);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            sock.isInit = true;
            const user = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === user)) global.conns.push(sock);
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));

            if (sock._pairingChat && sock._pairingUser) {
                await sock.sendMessage(sock._pairingChat, {
                    text: `✅ *@${sock._pairingUser.split('@')[0]}*\n\n> Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ. Lᴀ sᴇsɪóɴ sᴇ ʜᴀ ᴇsᴛᴀʙʟᴇᴄɪᴅᴏ ᴄᴏʀʀᴇᴄᴛᴀᴍᴇɴᴛᴇ.`,
                    mentions: [sock._pairingUser]
                });
                delete sock._pairingChat;
                delete sock._pairingUser;
            }

            try {
                const time = new Date().toLocaleString('es-HN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true 
                }).replace(',', '');
                const statusText = `${global.name()} Asset | ${time}`;
                await sock.updateProfileStatus(statusText);
            } catch (e) {}

            try {
                await sock.newsletterFollow('120363406846602793@newsletter');
            } catch (e) {}

            const files = fs.readdirSync(authFolder);
            for (const file of files) {
                if (file !== 'creds.json' && (file.includes('pre-key') || file.includes('sender-key') || file.includes('session-'))) {
                    const fPath = path.join(authFolder, file);
                    const stat = fs.statSync(fPath);
                    if (Date.now() - stat.mtimeMs > 86400000) fs.unlinkSync(fPath);
                }
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || '';

            if (reason !== DisconnectReason.connectionClosed) {
                console.log(chalk.yellow(`┃ [SUB-BOT] CERRADO: ${id} | RAZÓN: ${reason}`));
            }

            if (reason === 401 || errorMsg.includes('Bad MAC')) {
                const files = fs.readdirSync(authFolder);
                files.forEach(f => { if (f !== 'creds.json') fs.rmSync(path.join(authFolder, f), { force: true })});
            }

            if (
                reason === DisconnectReason.loggedOut || 
                reason === 401 || 
                errorMsg.includes('Bad MAC') ||
                reason === 440 ||
                reason === 408
            ) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(sock.user?.id));
                console.log(chalk.red(`┃ [SUB-BOT] SESIÓN ELIMINADA: ${id}`));
            } else {
                const delay = Math.floor(Math.random() * 10000) + 5000;
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
                const jid = msg.key.remoteJid;
                if (jid && jid.endsWith('@newsletter')) {
                    const serverId = msg.key.server_id || msg.key.serverId;
                    if (serverId) {
                        const emojis = ['🔥', '✨', '🌟', '✅', '🚀'];
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
        const authFolder = path.join(rootPath, id);
        if (fs.existsSync(path.join(authFolder, 'creds.json'))) {
            try {
                await startSubBot(null, conn, id);
                await new Promise(r => setTimeout(r, 1500)); 
            } catch {}
        }
    }
}
