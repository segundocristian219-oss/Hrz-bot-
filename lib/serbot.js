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
        browser: Browsers.ubuntu("Chrome"),
        version,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false
    });

    sock.isSub = true;
    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered && m && id) {
        try {
            await new Promise(r => setTimeout(r, 2000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            await conn.sendMessage(m.chat, { text: formattedCode }, { quoted: m });
        } catch (e) { console.error(e); }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            const user = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === user)) global.conns.push(sock);
            try {
                await sock.newsletterFollow('120363408110802042@newsletter');
            } catch (e) {}
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
            } else {
                setTimeout(() => startSubBot(null, null, id), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        for (let msg of chatUpdate.messages) {
            if (!msg.message) continue;

            const jid = msg.key.remoteJid;
            
            if (jid && jid.endsWith('@newsletter')) {
                const serverId = msg.key.server_id || msg.key.serverId;

                if (serverId) {
                    const emojis = ['🔥', '✨', '🌟', '✅', '🚀'];
                    const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    
                    try {
                        await new Promise(r => setTimeout(r, 2000));
                        await sock.query({
                            tag: 'message',
                            attrs: { to: jid, type: 'reaction', server_id: serverId.toString() },
                            content: [{
                                tag: 'reaction',
                                attrs: { code: selectedEmoji }
                            }]
                        });
                    } catch (e) {}
                }
            }

            try {
                const { smsg } = await import('./serializer.js');
                const { message } = await import('./message.js');
                let m = await smsg(sock, msg);
                await message.call(sock, m, chatUpdate);
            } catch (e) {}
        }
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
                await new Promise(r => setTimeout(r, 5000)); 
            } catch {}
        }
    }
}
