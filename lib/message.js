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
    const cache = global.groupCache;
    if (cache instanceof Map && cache.has(jid)) return cache.get(jid);
    try {
        const data = await conn.groupMetadata(jid);
        if (data?.id) {
            if (cache instanceof Map) cache.set(jid, data);
            return data;
        }
    } catch { return {}; }
    return {};
}

export async function message(m, chatUpdate) {
    if (!m || m.isBaileys) return;
    this.uptime = this.uptime || Date.now();
    const conn = this;

    const chatJid = m.chat;
    const senderJid = await getRealJid(conn, m.sender, m);
    const isValidName = (n) => n && !n.includes('@') && !/^\d+$/.test(n);

    let chat = null;
    if (m.isGroup) {
        chat = await global.Chat.findOne({ id: chatJid });
        if (!chat) {
            chat = await global.Chat.create({ 
                id: chatJid, isBanned: false, welcome: true, detect: true, 
                antiLink: true, autoStickers: false, antisub: false, 
                mutos: [], gacha: false, antiStatus: false 
            });
        }
    }

    let user = null;
    const isUser = m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid');
    if (isUser) {
        user = await global.User.findOne({ id: m.sender });
        const now = new Date();
        if (!user) {
            user = await global.User.create({ 
                id: m.sender, name: isValidName(m.pushName) ? m.pushName : "",
                exp: 0, muto: false, warnAntiLink: 0, lastSeen: now
            });
        } else {
            let shouldSave = false;
            if (m.pushName && (!user.name || /^\d+$/.test(user.name)) && isValidName(m.pushName)) {
                user.name = m.pushName;
                shouldSave = true;
            }
            if (now - new Date(user.lastSeen) > 60000) { // Solo actualiza lastSeen si pasó más de 1 min
                user.lastSeen = now;
                shouldSave = true;
            }
            if (shouldSave) await user.save();
        }
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []);
        return;
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || m.mtype == 'templateButtonReplyMessage' && m.msg.selectedId || m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId || m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId || '').trim();
    if (!msgText) return;

    // Lógica de administración (Intacta según tu solicitud)
    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0].split(':')[0]) || m.fromMe;

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
        if (participants.length > 0) {
            const getAdminStatus = (targetJid, targetAuthor) => {
                const p = participants.find(p => 
                    jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || 
                    (targetAuthor && jidNormalizedUser(p.id) === jidNormalizedUser(targetAuthor)) ||
                    (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetJid)) ||
                    (p.lid && targetAuthor && jidNormalizedUser(p.lid) === jidNormalizedUser(targetAuthor))
                );
                return !!(p?.admin || p?.isCommunityAdmin);
            };
            isAdmin = getAdminStatus(m.sender, m.author);
            isBotAdmin = getAdminStatus(conn.user.id, conn.user.lid);
        }
    }

    if (chat?.mutos?.includes(m.sender) && !isAdmin && !isROwner) {
        return await conn.sendMessage(m.chat, { delete: m.key });
    }

    // Procesar Plugins Before (Optimizado)
    const plugins = global.plugins;
    for (const name in plugins) {
        const plugin = plugins[name];
        if (plugin?.before && typeof plugin.before === 'function') {
            try {
                if (await plugin.before.call(this, m, { 
                    conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user 
                })) return;
            } catch (e) { console.error(chalk.red(`Error en before [${name}]:`), e); }
        }
    }

    const usedPrefix = ['#', '.', '/', '!'].find(p => msgText.startsWith(p));
    if (!usedPrefix) return;

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = commandName.toLowerCase();
    const text = args.join(' ').trim();

    const pluginName = plugins instanceof Map 
        ? (plugins.has(command) ? command : global.aliases.get(command))
        : (plugins[command] ? command : Object.keys(plugins).find(k => plugins[k].alias?.includes(command)));

    const plugin = plugins instanceof Map ? plugins.get(pluginName) : plugins[pluginName];

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        if (plugin.text && !text) return conn.reply(m.chat, `❀ Te falta el texto.\n\n> Ejemplo: *${usedPrefix}${command} Hola*`, m);

        const perms = {
            rowner: isROwner, owner: isROwner, group: m.isGroup, 
            botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup
        };

        for (const perm in perms) {
            if (plugin[perm] && !perms[perm]) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { 
                usedPrefix, noPrefix, args, command, text, conn, user, chat, 
                isROwner, isAdmin, isBotAdmin, participants 
            });
        } catch (e) { console.error(chalk.red(`Error en comando ${command}:`), e); }
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
    console.log(chalk.bold.greenBright(`Actualización detectada en message.js`));
});
