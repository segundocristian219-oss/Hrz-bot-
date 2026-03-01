import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';
import { uploadError } from './db_logs.js';
import NodeCache from 'node-cache';

const __filename = fileURLToPath(import.meta.url);

async function getGroupMetadata(conn, jid) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    
    if (global.groupCache.has(jid)) return global.groupCache.get(jid);
    
    try {
        const data = await conn.groupMetadata(jid);
        if (data) {
            global.groupCache.set(jid, data);
            return data;
        }
    } catch { return {}; }
}


export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m) return;
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.chat;
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';
    const senderJid = await getRealJid(conn, m.sender, m);
    const botJid = jidNormalizedUser(conn.user.id);
    const isMainBot = (cleanId(global.botNumber) === cleanId(botJid));

    const db = global.db.data;
    db.chats[chatJid] ||= { isBanned: false, welcome: true, detect: true, antiLink: true, autoStickers: false, antisub: false, mutos: [], gacha: false, antiStatus: false };
    db.groupGacha ||= {};

    const isValidName = (n) => n && !n.includes('@') && !/^\d+$/.test(n);
    if (!(m.sender in db.users)) db.users[m.sender] = { exp: 0, muto: false, warnAntiLink: 0, name: isValidName(m.pushName) ? m.pushName : "" };

    if (m.messageStubType) {
    getGroupMetadata(conn, m.chat).then(metadata => {
        events(conn, m, metadata.participants || []);
    });
    return;
    }


    const chat = db.chats[chatJid];
    let participants = [];
    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
    }

    const user = db.users[m.sender];
    const isROwner = global.owner?.some(([num]) => num.replace(/\D/g, '') === cleanId(senderJid)) || m.fromMe;
    const isOwner = isROwner;

    let isAdmin = false, isBotAdmin = false;
    if (m.isGroup && participants.length > 0) {
        const getAdminStatus = (targetJid) => {
            const p = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
            return !!(p?.admin || p?.isCommunityAdmin);
        };
        isAdmin = getAdminStatus(m.sender);
        isBotAdmin = getAdminStatus(conn.user.id);
    }

    if (global.plugins) {
        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (plugin?.before && typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants, chatUpdate, chat, user, db })) return;
            }
        }
    }

    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => m.text && m.text.startsWith(p));
    if (!usedPrefix) return;

    const textAfterPrefix = m.text.slice(usedPrefix.length).trim();
    const [commandName, ...args] = textAfterPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    if (m.isBaileys || !command) return;
    if (m.isGroup && !isMainBot && chat.antisub) return;

    const pluginsReady = global.plugins instanceof Map && global.aliases instanceof Map;
    if (!pluginsReady) return;

    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    const plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        if (plugin.text && !text) return conn.reply(m.chat, `❀ Te falta el término de búsqueda.\n\n> Ejemplo: *${usedPrefix}${command} Hola*`, m);

        const checkPermissions = (perm) => ({ rowner: isROwner, owner: isOwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup }[perm]);
        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { usedPrefix, noPrefix: text, args, command, text, conn, user, chat, isROwner, isOwner, isAdmin, isBotAdmin, isMainBot, chatUpdate, participants });
        } catch (e) {
            console.error(e);
            const supportUrl = await uploadError(e).catch(() => ({ split: () => [] }));
            const errorId = supportUrl.split('=')[1] || 'N/A';
            const report = `*───「 ⚠️ FALLO 」───*\n\n*ID:* #${errorId}\n\n*LOG:*\n\`\`\`${e.message}\`\`\``;
            await conn.sendMessage(m.chat, { text: report }, { quoted: m }).catch(() => null);
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
    console.log(chalk.bold.greenBright(`Actualización detectada...`));
});
