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
const msgRetryCounterCache = new NodeCache();
const userDevicesCache = new NodeCache();
const silentLogger = pino({ level: 'silent' });

export async function startSubBot(m, conn, id) {
    const authFolder = path.join(process.cwd(), 'sessions/jadibts', id);
    
    let isOnline = global.conns.find(c => c.user && jidNormalizedUser(c.user.id) === jidNormalizedUser(`${id}@s.whatsapp.net`));
    if (isOnline && isOnline.ws.isOpen) {
        if (m) return conn.sendMessage(m.chat, { text: `✅ *SISTEMA ACTIVO*` }, { quoted: m });
        return;
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
        syncFullHistory: false,
        msgRetryCounterCache,
        userDevicesCache,
        retryRequestDelayMs: 5000,
    });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        if (!m || !id) return;
        try {
            await new Promise(r => setTimeout(r, 5000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            await conn.sendMessage(m.chat, { text: `\n\n\t\t\t\t${formattedCode}\n\n\t` }, { quoted: m });
            sock._pairingChat = m.chat;
        } catch (e) { console.error(chalk.red(`[PAIRING ERROR]`), e.message); }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            retryCount.set(id, 0); 
            const user = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => c.user && jidNormalizedUser(c.user.id) === user)) global.conns.push(sock);
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));
            
            const files = fs.readdirSync(authFolder);
            for (const file of files) {
                if (file !== 'creds.json') {
                    const fPath = path.join(authFolder, file);
                    const stat = fs.statSync(fPath);
                    if (Date.now() - stat.mtimeMs > 86400000) fs.unlinkSync(fPath);
                }
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const currentRetries = retryCount.get(id) || 0;

            if (reason === DisconnectReason.loggedOut || reason === 401 || currentRetries >= 2) {
                console.log(chalk.red(`┃ [SUB-BOT] ELIMINANDO SESIÓN CORRUPTA/EXPIRADA: ${id}`));
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => c.user && jidNormalizedUser(c.user.id) !== jidNormalizedUser(sock.user?.id));
                retryCount.delete(id);
            } else {
                retryCount.set(id, currentRetries + 1);
                const delay = Math.floor(Math.random() * 5000) + 5000;
                setTimeout(() => startSubBot(null, conn, id), delay);
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
                if (message) await message.call(sock, m, chatUpdate);
            }
        } catch (e) {}
    });

    return sock;
}

export async function loadSubBots(conn) {
    const rootPath = path.join(process.cwd(), 'sessions/jadibts');
    if (!fs.existsSync(rootPath)) return;
    const folders = fs.readdirSync(rootPath).filter(id => fs.existsSync(path.join(rootPath, id, 'creds.json')));
    
    const CONCURRENCY = 3;
    const queue = [...folders];

    const worker = async () => {
        while (queue.length > 0) {
            const id = queue.shift();
            await startSubBot(null, conn, id);
            await new Promise(r => setTimeout(r, 2000));
        }
    };

    for (let i = 0; i < Math.min(CONCURRENCY, folders.length); i++) {
        worker();
    }
}
