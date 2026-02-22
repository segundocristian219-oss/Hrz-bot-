import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './events.js';
import { uploadError } from './db_logs.js';
import NodeCache from 'node-cache';

const groupCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const requestQueue = new Map();

async function getGroupMetadata(conn, jid) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    let metadata = groupCache.get(jid);
    if (metadata) return metadata;
    if (requestQueue.has(jid)) return requestQueue.get(jid);
    const fetchPromise = (async () => {
        try {
            const data = await conn.groupMetadata(jid);
            if (data && data.id) {
                groupCache.set(jid, data);
                return data;
            }
        } catch (e) {
            if (e.id === 'rate-overlimit' || e.statusCode === 429 || e.message?.includes('rate-overlimit')) {
                console.warn(`[Rate Limit] Ignorando ${jid} para evitar reinicio.`);
            }
            return {};
        } finally {
            requestQueue.delete(jid);
        }
        return {};
    })();
    requestQueue.set(jid, fetchPromise);
    return fetchPromise;
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
    const isSubBot = (global.conns || []).some(c => c.user && cleanId(c.user.id) === cleanId(botJid));
    const isMainBot = !isSubBot;

    const db = global.db.data;
    db.chats[chatJid] ||= { 
        isBanned: false, 
        welcome: true, 
        detect: true, 
        antiLink: true,
        antisub: false,
        mutos: [],
        gacha: false
    };
    db.groupGacha ||= {};

    const isValidName = (n) => n && !n.includes('@') && !/^\d+$/.test(n);

    if (!(m.sender in db.users)) {
        db.users[m.sender] = { exp: 0, muto: false, warnAntiLink: 0, name: isValidName(m.pushName) ? m.pushName : "" };
    } else if (m.pushName && (!db.users[m.sender].name || /^\d+$/.test(db.users[m.sender].name))) {
        if (isValidName(m.pushName)) db.users[m.sender].name = m.pushName;
    }

    if (m.mentionedJid && m.mentionedJid.length > 0) {
        m.mentionedJid.forEach((jid, index) => {
            if (!(jid in db.users)) db.users[jid] = { exp: 0, muto: false, warnAntiLink: 0 };
            let mentionedName = m.mentionedNames[index];
            if (isValidName(mentionedName) && (!db.users[jid].name || /^\d+$/.test(db.users[jid].name))) {
                db.users[jid].name = mentionedName;
            }
        });
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        const parts = metadata.participants || [];
        await events(conn, m, parts);
        return;
    }

    const chat = db.chats[chatJid];
    const user = db.users[m.sender];
    let participants = [];
    let groupMetadata = {};

    if (m.isGroup) {
        groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
    }

    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === cleanId(senderJid)) || m.fromMe;
    const isOwner = isROwner;

    let isAdmin = false, isBotAdmin = false;
    if (m.isGroup && participants.length > 0) {
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

    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        if (plugin && plugin.before && typeof plugin.before === 'function') {
            if (await plugin.before.call(this, m, {
                conn, isAdmin, isBotAdmin, isOwner, isROwner, participants, chatUpdate, chat, user, db
            })) return;
        }
    }

    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => m.text && m.text.startsWith(p));
    if (!usedPrefix) return;

    const textAfterPrefix = m.text.slice(usedPrefix.length).trim();
    const [commandName, ...args] = textAfterPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    if (m.isGroup && !isMainBot && chat.antisub) return;
    if (m.isBaileys) return;

    if (m.isGroup && chat.mutos.includes(senderJid)) {
        if (!isAdmin && isBotAdmin) {
            await conn.sendMessage(m.chat, { delete: m.key });
            return;
        }
    }

    if (!command) return;

    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    const plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        if (plugin.text && !text) {
            return conn.reply(m.chat, `❀ Te falta el término de búsqueda o el texto necesario.\n\n> Ejemplo: *${usedPrefix}${command} Hola*`, m);
        }

        const checkPermissions = (perm) => ({
            rowner: isROwner,
            owner: isOwner,
            group: m.isGroup,
            botAdmin: isBotAdmin,
            admin: isAdmin,
            private: !m.isGroup
        }[perm]);

        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            if (typeof plugin.run === 'function') {
                await plugin.run.call(conn, m, { 
                    usedPrefix, noPrefix: text, args, command, text, 
                    conn, user, chat, isROwner, isOwner, isAdmin, 
                    isBotAdmin, isMainBot, isSubAssistant: !isMainBot, chatUpdate, participants
                });
            }
        } catch (e) {
            console.error(e);
            const supportUrl = await uploadError(e);
            const errorId = supportUrl.split('=')[1] || 'N/A';
            const errorMessage = e.stack || e.message || e;
            const report = `*───「 ⚠️ FALLO DE SISTEMA 」───*\n\n` +
                           `*ID de Log:* #${errorId}\n\n` +
                           `*LOG TÉCNICO:*\n\`\`\`${errorMessage}\`\`\``;
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

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Actualización detectada...`));
});
