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
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.chat;
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';
    const senderJid = await getRealJid(conn, m.sender, m);
    
    const db = global.db.data;
    db.chats[chatJid] ||= { isBanned: false, welcome: true, detect: true, antiLink: true, antisub: false, mutos: [] };

    // Validación de usuario
    if (!(m.sender in db.users)) db.users[m.sender] = { exp: 0, muto: false, name: m.pushName || "" };

    // Manejo de Eventos de WhatsApp (Admin update, etc)
    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []);
        return;
    }

    // Extraer texto de cualquier tipo de mensaje
    const msgText = (m.text || m.msg?.caption || m.msg?.text || m.mtype == 'templateButtonReplyMessage' && m.msg.selectedId || m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId || m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId || '').trim();
    
    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));
    
    // Si no hay prefix y no es un mensaje de Baileys, ejecutamos los "before" (pueden ser comandos sin prefix)
    const chat = db.chats[chatJid];
    const user = db.users[m.sender];
    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === cleanId(senderJid)) || m.fromMe;

    let participants = m.isGroup ? (await getGroupMetadata(conn, chatJid)).participants || [] : [];
    let isAdmin = m.isGroup ? participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(m.sender) && p.admin) : false;
    let isBotAdmin = m.isGroup ? participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(conn.user.id) && p.admin) : false;

    // Ejecutar plugins con propiedad .before
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        if (plugin?.before && typeof plugin.before === 'function') {
            if (await plugin.before.call(this, m, { conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user, db })) return;
        }
    }

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

        const checkPermissions = (perm) => ({
            rowner: isROwner, owner: isROwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup
        }[perm]);

        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { 
                usedPrefix, noPrefix, args, command, text, conn, user, chat, 
                isROwner, isAdmin, isBotAdmin, participants 
            });
        } catch (e) {
            console.error(chalk.red(`Error en comando ${command}:`), e);
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
    console.log(chalk.bold.greenBright(`Actualización detectada en message.js`));
});
