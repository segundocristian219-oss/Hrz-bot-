import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';

async function getGroupMetadata(conn, jid) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    if (global.groupCache instanceof Map && global.groupCache.has(jid)) return global.groupCache.get(jid);
    try {
        const data = await conn.groupMetadata(jid);
        if (data?.id) {
            if (global.groupCache instanceof Map) global.groupCache.set(jid, data);
            return data;
        }
    } catch { return {}; }
    return {};
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m) return;

    const chatJid = m.chat;
    const senderJid = await getRealJid(conn, m.sender, m);
    const isValidName = (n) => n && !n.includes('@') && !/^\d+$/.test(n);

    let chat = null;
    if (m.isGroup) {
        chat = await global.Chat.findOne({ id: chatJid });
        if (!chat) {
            chat = await global.Chat.create({ 
                id: chatJid,
                isBanned: false, welcome: true, detect: true, antiLink: true,
                autoStickers: false, antisub: false, mutos: [], gacha: false, antiStatus: false
            });
        }
    }

    let user = null;
    if (m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid')) {
        user = await global.User.findOne({ id: m.sender });
        if (!user) {
            user = await global.User.create({ 
                id: m.sender, name: isValidName(m.pushName) ? m.pushName : "",
                exp: 0, muto: false, warnAntiLink: 0, lastSeen: new Date()
            });
        } else {
            if (m.pushName && (!user.name || /^\d+$/.test(user.name))) {
                if (isValidName(m.pushName)) user.name = m.pushName;
            }
            user.lastSeen = new Date();
            await user.save();
        }
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []);
        return;
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim();
    const isROwner = global.owner?.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0]) || m.fromMe;

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
        const getAdminStatus = (targetJid) => {
            const p = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
            return !!(p?.admin || p?.isCommunityAdmin);
        };
        isAdmin = getAdminStatus(m.sender);
        isBotAdmin = getAdminStatus(conn.user.id);
    }

    if (chat?.mutos?.includes(m.sender) && !isAdmin && !isROwner) {
        await conn.sendMessage(m.chat, { delete: m.key });
        return;
    }

    const allPlugins = Array.from(global.plugins.values());
    for (const plugin of allPlugins) {
        if (plugin?.before && typeof plugin.before === 'function') {
            try {
                if (await plugin.before.call(this, m, { conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user })) return;
            } catch (e) { console.error(e); }
        }
    }

    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));
    if (!usedPrefix || m.isBaileys) return;

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    const plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        if (plugin.text && !text) return conn.reply(m.chat, `❀ Te falta el texto.\n\n> Ejemplo: *${usedPrefix}${command} Hola*`, m);

        const perms = { rowner: isROwner, owner: isROwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup };
        for (const p of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[p] && !perms[p]) {
                global.dfail(p, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, user, chat, isROwner, isAdmin, isBotAdmin, participants });
        } catch (e) { console.error(e); }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `> ╰❒ Solo mi creador puede usar este comando.`,
        owner: `> ╰❒ Solo mi creador puede usar este comando.`,
        group: `> ╰✎ Este comando sólo se puede usar en grupos.`,
        private: `De esto solo hablo en privado.`,
        admin: `> ╰♛ Sólo los administradores pueden ejecutar este comando.`,
        botAdmin: `> ╰✰ Necesito ser administrador.`,
    }[type];
    if (msg) conn.reply(m.chat, msg, m).catch(() => null);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Actualización detectada en message.js`));
});
