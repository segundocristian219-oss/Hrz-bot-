import { fileURLToPath } from 'url';
import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';
import { uploadError } from './db_logs.js';

const __filename = fileURLToPath(import.meta.url);

async function getGroupMetadata(conn, jid) {
    if (!jid || !jid.endsWith('@g.us')) return { participants: [] };
    if (global.groupCache?.has?.(jid)) return global.groupCache.get(jid);
    try {
        const data = await conn.groupMetadata(jid);
        if (data) {
            global.groupCache?.set?.(jid, data);
            return data;
        }
    } catch { return { participants: [] }; }
    return { participants: [] };
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m || !m.message) return;
    
    // Prioridad: Si la DB no está, la cargamos sin bloquear si es posible
    if (!global.db.data) await global.loadDatabase();

    const chatJid = m.chat;
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';
    
    // Cachear sender para evitar procesar JID cada vez
    const senderJid = m.sender; 
    const botJid = jidNormalizedUser(conn.user.id);
    const isMainBot = (cleanId(global.botNumber) === cleanId(botJid));

    const db = global.db.data;
    const chat = db.chats[chatJid] ||= { isBanned: false, welcome: true, detect: true, antiLink: true, autoStickers: false, antisub: false, mutos: [], gacha: false, antiStatus: false };

    // StubTypes en background total
    if (m.messageStubType) {
        getGroupMetadata(conn, m.chat).then(metadata => {
            events(conn, m, metadata.participants || []).catch(() => null);
        });
        return;
    }

    // Registro rápido de usuario
    if (!(m.sender in db.users)) {
        db.users[m.sender] = { exp: 0, muto: false, warnAntiLink: 0, name: m.pushName || "" };
    }

    let participants = [];
    let isAdmin = false, isBotAdmin = false;

    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
        const jidUser = jidNormalizedUser(m.sender);
        const jidBot = jidNormalizedUser(conn.user.id);
        
        const pUser = participants.find(p => jidNormalizedUser(p.id) === jidUser);
        const pBot = participants.find(p => jidNormalizedUser(p.id) === jidBot);
        
        isAdmin = !!(pUser?.admin || pUser?.isCommunityAdmin);
        isBotAdmin = !!(pBot?.admin || pBot?.isCommunityAdmin);
    }

    const isROwner = global.owner?.some(([num]) => num.replace(/\D/g, '') === cleanId(senderJid)) || m.fromMe;
    const user = db.users[m.sender];

    // Ejecución de plugins .before (Optimizado)
    if (global.plugins) {
        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (plugin?.before && typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, { conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chatUpdate, chat, user, db })) return;
            }
        }
    }

    // Prefijos instantáneos
    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => m.text?.startsWith?.(p));
    if (!usedPrefix) return;

    const textAfterPrefix = m.text.slice(usedPrefix.length).trim();
    const [commandName, ...args] = textAfterPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    if (m.isBaileys || !command) return;
    if (m.isGroup && !isMainBot && chat.antisub) return;

    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    const plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        
        // Verificación de permisos rápida
        const checkPermissions = (perm) => {
            if (perm === 'rowner' || perm === 'owner') return isROwner;
            if (perm === 'group') return m.isGroup;
            if (perm === 'private') return !m.isGroup;
            if (perm === 'admin') return isAdmin;
            if (perm === 'botAdmin') return isBotAdmin;
            return true;
        };

        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { usedPrefix, noPrefix: text, args, command, text, conn, user, chat, isROwner, isOwner: isROwner, isAdmin, isBotAdmin, isMainBot, chatUpdate, participants });
        } catch (e) {
            console.error(e);
            uploadError(e).then(supportUrl => {
                const errorId = supportUrl?.split('=')[1] || 'N/A';
                conn.sendMessage(m.chat, { text: `*⚠️ ERROR:* #${errorId}\n${e.message}` }, { quoted: m }).catch(() => null);
            }).catch(() => null);
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `> ╰❒ Solo mi creador puede usar este comando.`,
        owner: `> ╰❒ Solo mi creador puede usar este comando.`,
        group: `> ╰✎ Este comando sólo se puede usar en grupos.`,
        private: `De esto solo hablo en privado.`,
        admin: `> ╰♛ Sólo los administradores pueden ejecutar este comando.`,
        botAdmin: `> ╰✰ Necesito ser administrador.`,
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m).catch(() => null);
};

watchFile(__filename, () => {
    unwatchFile(__filename);
    console.log(chalk.bold.greenBright(`Actualización detectada en message.js...`));
});
