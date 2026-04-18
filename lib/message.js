import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';

const __filename = fileURLToPath(import.meta.url);

async function getGroupMetadata(conn, jid, force = false) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    if (!force && global.groupCache?.has(jid)) return global.groupCache.get(jid);
    try {
        const data = await conn.groupMetadata(jid);
        if (data?.id) {
            if (!global.groupCache) global.groupCache = new Map();
            global.groupCache.set(jid, data);
            return data;
        }
    } catch { return global.groupCache?.get(jid) || {}; }
    return {};
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m) return;

    const chatJid = m.chat;
    const senderJid = await getRealJid(conn, m.sender, m);
    
    let chat = null;
    try {
        if (m?.isGroup) {
            chat = await global.Chat.findOneAndUpdate(
                { id: chatJid },
                { $setOnInsert: { id: chatJid, isBanned: false, primaryBot: null } },
                { upsert: true, new: true }
            );
        }
    } catch (e) { return; }

    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0].split(':')[0]) || m.fromMe;
    const botJid = jidNormalizedUser(conn.user.id);

    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        const groupMetadata = await getGroupMetadata(conn, chatJid);
        const participants = groupMetadata.participants || [];
        
        const admins = participants.filter(p => p.admin).map(p => [
            p.id ? jidNormalizedUser(p.id) : null,
            p.phoneNumber ? jidNormalizedUser(p.phoneNumber) : null
        ]).flat().filter(Boolean);

        isAdmin = admins.includes(jidNormalizedUser(m.sender)) || admins.includes(jidNormalizedUser(senderJid));
        isBotAdmin = admins.includes(botJid);
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim();
    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));
    if (!usedPrefix) return;

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    if (m.isGroup && chat) {
        if (chat.primaryBot && chat.primaryBot !== botJid && !['setprimary', 'estado'].includes(command)) return;
        if (chat.isBanned && !['estado', 'setprimary'].includes(command) && !isROwner) return;
    }

    const pluginName = global.plugins instanceof Map 
        ? (global.plugins.has(command) ? command : global.aliases?.get(command))
        : Object.keys(global.plugins).find(k => k === command || (global.plugins[k].alias && global.plugins[k].alias.includes(command)));

    const plugin = global.plugins instanceof Map ? global.plugins.get(pluginName) : global.plugins[pluginName];

    if (plugin) {
        if (m.isGroup && (plugin.admin || plugin.botAdmin)) {
            const groupMetadata = await getGroupMetadata(conn, chatJid, true);
            const participants = groupMetadata.participants || [];
            const admins = participants.filter(p => p.admin).map(p => [
                p.id ? jidNormalizedUser(p.id) : null,
                p.phoneNumber ? jidNormalizedUser(p.phoneNumber) : null
            ]).flat().filter(Boolean);

            isAdmin = admins.includes(jidNormalizedUser(m.sender)) || admins.includes(jidNormalizedUser(senderJid));
            isBotAdmin = admins.includes(botJid);
        }

        const check = (p) => ({ rowner: isROwner, owner: isROwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup }[p]);
        for (const p of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[p] && !check(p)) {
                global.dfail(p, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, chat, isROwner, isAdmin, isBotAdmin });
        } catch (e) { console.error(e); }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: '> Solo mi creador.',
        owner: '> Solo mi creador.',
        group: '> Solo en grupos.',
        admin: '> Solo administradores.',
        botAdmin: '> Necesito ser admin.'
    }[type];
    if (msg) conn.reply(m.chat, msg, m);
};
