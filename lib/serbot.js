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

const logger = pino({ level: 'silent' });

export async function startSubBot(m, conn, id) {
    const authFolder = path.join(process.cwd(), 'sessions/jadibts', id);
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: Browsers.ubuntu("Chrome"),
        version,
        markOnlineOnConnect: true,
        printQRInTerminal: false,
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        if (!id) return;
        try {
            await new Promise(r => setTimeout(r, 2000));
            const code = await sock.requestPairingCode(id);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
            
            await conn.sendMessage(m.chat, { 
                text: `┏━━━━ 「 VINCULACIÓN 」 ━━━━┓\n┃\n┃ ◈ Código: *${formattedCode}*\n┃\n┗━━━━━━━━━━━━━━━━━━━━━━┛`,
                contextInfo: {
                    externalAdReply: {
                        title: "SISTEMA SUB-BOT",
                        body: "Usa el código para vincular tu dispositivo",
                        thumbnailUrl: "https://api.dix.lat/media/1773635411398_f9REwtsTW.jpeg",
                        sourceUrl: "https://dix.lat",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
        } catch (e) {
            console.error(chalk.red(`[SERBOT ERROR]`), e);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            sock.isInit = true;
            const user = jidNormalizedUser(sock.user.id);
            if (!global.conns.some(c => jidNormalizedUser(c.user.id) === user)) global.conns.push(sock);
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(chalk.yellow(`┃ [SUB-BOT] CERRADO: ${id} | RAZÓN: ${reason}`));

            if (reason === DisconnectReason.loggedOut || reason === 401) {
                if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
                global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(sock.user?.id));
            } else {
                setTimeout(() => startSubBot(null, null, id), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./message.js');
            for (let msg of chatUpdate.messages) {
                if (!msg.message || msg.key.fromMe) continue;
                let m = await smsg(sock, msg);
                await message.call(sock, m, chatUpdate);
            }
        } catch (e) {}
    });

    return sock;
}
