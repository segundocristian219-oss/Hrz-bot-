import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';

async function getGroupMetadata(conn, jid) {
    if (!jid?.endsWith('@g.us')) return {};
    if (global.groupCache?.has(jid)) return global.groupCache.get(jid);
    try {
        const data = await conn.groupMetadata(jid);
        if (data?.id) {
            global.groupCache?.set(jid, data);
            return data;
        }
    } catch { return {}; }
    return {};
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    if (!m) return;
    const conn = this;

    const senderJid = await getRealJid(conn, m.sender, m);
    const senderNumber = senderJid.split('@')[0].split(':')[0];
    
    const isROwner = global.owner.some(([num]) => {
        const cleanNum = num.replace(/\D/g, '');
        return cleanNum === senderNumber;
    }) || m.fromMe;

    let chat = null;
    if (m.isGroup) {
        chat = await global.Chat.findOne({ id: m.chat }).lean();
        if (!chat) {
            chat = await global.Chat.create({ 
                id: m.chat,
                isBanned: false, welcome: true, detect: true, antiLink: true
            });
        }
    }

    const isUser = m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid');
    let user = null;
    if (isUser) {
        user = await global.User.findOne({ id: m.sender });
        const isValidName = m.pushName && !m.pushName.includes('@') && !/^\d+$/.test(m.pushName);
        
        if (!user) {
            user = await global.User.create({ 
                id: m.sender, 
                name: isValidName ? m.pushName : "",
                lastSeen: new Date()
            });
        } else {
            user.lastSeen = new Date();
            if (isValidName && (!user.name || /^\d+$/.test(user.name))) user.name = m.pushName;
            await user.save();
        }
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []);
        return;
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim();
    
    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, m.chat);
        participants = groupMetadata.participants || [];
        const botId = jidNormalizedUser(conn.user.id);
        const botLid = conn.user.lid ? jidNormalizedUser(conn.user.lid) : null;

        const getAdminStatus = (targetJid) => {
            const normalized = jidNormalizedUser(targetJid);
            const p = participants.find(p => jidNormalizedUser(p.id) === normalized || (p.lid && jidNormalizedUser(p.lid) === normalized));
            return !!(p?.admin || p?.isCommunityAdmin);
        };

        isAdmin = getAdminStatus(m.sender);
        isBotAdmin = getAdminStatus(botId) || (botLid ? getAdminStatus(botLid) : false);
    }

    if (chat?.mutos?.includes(m.sender) && !isAdmin && !isROwner) {
        return await conn.sendMessage(m.chat, { delete: m.key });
    }

    for (const plugin of global.plugins.values()) {
        if (plugin?.before && typeof plugin.before === 'function') {
            try {
                if (await plugin.before.call(this, m, { 
                    conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user 
                })) return;
            } catch {}
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

        const perms = {
            rowner: isROwner, owner: isROwner, group: m.isGroup, 
            botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup
        };

        for (const key in perms) {
            if (plugin[key] && !perms[key]) {
                global.dfail(key, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { 
                usedPrefix, noPrefix, args, command, text, conn, user, chat, 
                isROwner, isAdmin, isBotAdmin, participants 
            });
        } catch (e) {
            console.error(e);
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

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Update: message.js`));
});
