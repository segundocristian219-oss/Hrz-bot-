import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';

const __filename = fileURLToPath(import.meta.url);

async function getGroupMetadata(conn, jid, force = false) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    if (!force && global.groupCache instanceof Map && global.groupCache.has(jid)) return global.groupCache.get(jid);
    try {
        const data = await Promise.race([
            conn.groupMetadata(jid),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        if (data?.id) {
            if (global.groupCache instanceof Map) global.groupCache.set(jid, data);
            return data;
        }
    } catch { 
        return global.groupCache?.get?.(jid) || {}; 
    }
    return {};
}

const restrictedPrefixes = ['966', '967', '92', '212', '504', '91', '234', '20', '972'];
const restrictedCmds = ['creador', 'owner', 'contacto', 'devs', 'developer', 'desarrolladores', 'soporte'];

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m || !conn?.user) return;

    const botJid = jidNormalizedUser(conn.user.id);
    const botSettings = global.subbotConfig?.[botJid] || { 
        prefix: '.', 
        botName: 'Kirito', 
        botImage: 'https://api.dix.lat/media2/1773637281084.jpg' 
    };
    conn.settings = botSettings;

    const chatJid = m.chat;
    const senderJid = await getRealJid(conn, m.sender, m);
    const isValidName = (n) => n && !n.includes('@') && !/^\d+$/.test(n);

    let chat = null;
    let user = null;

    try {
        if (m?.isGroup) {
            chat = await global.Chat.findOneAndUpdate(
                { id: chatJid },
                { 
                    $setOnInsert: { 
                        id: chatJid, isBanned: false, welcome: true, muto: false, 
                        detect: true, antiLink: true, modoadmin: false, 
                        autoStickers: false, antisub: false, mutos: [], 
                        nsfw: false, antiStatus: false 
                    } 
                },
                { upsert: true, new: true }
            );
        }

        if (m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid')) {
            const realSenderId = await getRealJid(conn, m.sender, m);
            const rawLid = m.key.participant?.endsWith('@lid') ? m.key.participant : (m.sender.endsWith('@lid') ? m.sender : "");

            let query = { $or: [{ id: realSenderId }, { lid: realSenderId }, { lid: rawLid }].filter(i => i) };

            let updateData = {
                $setOnInsert: {
                    name: isValidName(m.pushName) ? m.pushName : "",
                    exp: 0,
                    warnAntiLink: 0,
                    col: 10,
                    marry: "",
                    marryDate: 0,
                    banned: false,
                    banReason: ""
                },
                $set: { lastSeen: new Date() }
            };

            if (realSenderId.endsWith('@s.whatsapp.net')) updateData.$set.id = realSenderId;
            if (rawLid || realSenderId.endsWith('@lid')) updateData.$set.lid = rawLid || realSenderId;

            user = await global.User.findOneAndUpdate(query, updateData, { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true 
            }).catch(() => null);
        }
    } catch (e) {
        return; 
    }

    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0].split(':')[0]) || m.fromMe;

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        let groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];

        const getAdminStatus = (targetJid, targetAuthor) => {
            const p = participants.find(p => 
                jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || 
                (targetAuthor && jidNormalizedUser(p.id) === jidNormalizedUser(targetAuthor)) ||
                (p.lid && jidNormalizedUser(p.id) === jidNormalizedUser(targetJid)) ||
                (p.lid && targetAuthor && jidNormalizedUser(p.lid) === jidNormalizedUser(targetAuthor))
            );
            return !!(p?.admin || p?.isCommunityAdmin);
        };

        isAdmin = getAdminStatus(m.sender, m.author);
        isBotAdmin = getAdminStatus(conn.user.id, conn.user.lid);
    }

    if (m.isGroup && chat && !isROwner) {
        if (chat.isBanned) return;
        const isUserMuted = chat.muto || (Array.isArray(chat.mutos) && chat.mutos.includes(senderJid));
        if (isUserMuted) {
            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
            }
            return; 
        }
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []).catch(() => null);
        return;
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim();
    if (!msgText && !m.messageStubType && !m.msg?.image && !m.msg?.video) return; 

    const isMainBot = jidNormalizedUser(conn.user.id) === jidNormalizedUser(global.conn?.user?.id);
    if (m.isGroup && chat?.antisub === true && !isMainBot) return;

    const subBotPrefix = conn.settings?.prefix;
    const prefixes = subBotPrefix ? [subBotPrefix] : ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));

    if (!usedPrefix) {
        const allPlugins = global.plugins instanceof Map ? Array.from(global.plugins.values()) : Object.values(global.plugins);
        for (const plugin of allPlugins) {
            if (plugin?.before && typeof plugin.before === 'function') {
                try {
                    if (await plugin.before.call(this, m, { 
                        conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user 
                    })) return;
                } catch {}
            }
        }
        return;
    }

    if (user?.banned && !isROwner) return;
    if (m.isGroup && chat?.modoadmin && !isAdmin && !isROwner) return;

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    if (!isROwner && restrictedCmds.includes(command)) {
        const sNum = m.sender.split('@')[0];
        if (restrictedPrefixes.some(p => sNum.startsWith(p))) {
            return conn.sendMessage(m.chat, {
                image: { url: global.img2(conn) },
                caption: '> *Comando restringido.*',
                mentions: [m.sender]
            }, { quoted: m }).catch(() => null);
        }
    }

    const pluginName = global.plugins instanceof Map 
        ? (global.plugins.has(command) ? command : global.aliases.get(command))
        : (global.plugins[command] ? command : Object.keys(global.plugins).find(k => global.plugins[k].alias && global.plugins[k].alias.includes(command)));

    const plugin = global.plugins instanceof Map ? global.plugins.get(pluginName) : global.plugins[pluginName];

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;

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
            if (!global.conn || (conn.isSub && conn.user.id !== global.conn.user?.id)) {
                global.conn = conn;
            }

            await plugin.run.call(conn, m, { 
                usedPrefix, noPrefix, args, command, text, conn, user, chat, 
                isROwner, isAdmin, isBotAdmin, participants,
                settings: conn.settings || {}
            });
        } catch (e) {
            console.error(chalk.red(`Error en comando ${command}:`), e.message);
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `> Solo mi creador puede usar este comando.`,
        admin: `> Sólo administradores.`,
        botAdmin: `> Necesito ser administrador.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m).catch(() => null);
};
