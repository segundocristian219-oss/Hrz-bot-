import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './event/detect.js';

const __filename = fileURLToPath(import.meta.url);

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
    let user = null;

    try {
        if (m.isGroup) {
            chat = await global.Chat.findOne({ id: chatJid });
            if (!chat) {
                chat = await global.Chat.create({ 
                    id: chatJid,
                    isBanned: false,
                    welcome: true, 
                    muto: false, 
                    detect: true, 
                    antiLink: true,
                    modoadmin: false,
                    autoStickers: false,
                    antisub: false,
                    mutos: [], 
                    nsfw: false,
                    antiStatus: false
                });
            }
        }

        if (m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid')) {
            const realSenderId = await getRealJid(conn, m.sender, m);
            const rawLid = m.key.participant?.endsWith('@lid') ? m.key.participant : (m.sender.endsWith('@lid') ? m.sender : "");

            user = await global.User.findOne({ 
                $or: [{ id: realSenderId }, { lid: realSenderId }, { lid: rawLid }].filter(i => i)
            });

            if (!user) {
                user = await global.User.create({ 
                    id: realSenderId.endsWith('@s.whatsapp.net') ? realSenderId : "",
                    lid: rawLid || (realSenderId.endsWith('@lid') ? realSenderId : ""),
                    name: isValidName(m.pushName) ? m.pushName : "",
                    exp: 0, 
                    warnAntiLink: 0, 
                    col: 10, 
                    lastSeen: new Date(),
                    marry: "",
                    marryDate: 0
                });
            } else {
                let update = {};
                if (realSenderId.endsWith('@s.whatsapp.net') && user.id !== realSenderId) update.id = realSenderId;
                if (rawLid && user.lid !== rawLid) update.lid = rawLid;
                if (Object.keys(update).length > 0) await global.User.updateOne({ _id: user._id }, { $set: update });
            }
        }
    } catch (e) {
        console.error(chalk.red(`[DATABASE ERROR]`), e.message);
        return; 
    }

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

    if (m.isGroup && chat) {
        const isUserMuted = chat.muto || (Array.isArray(chat.mutos) && chat.mutos.includes(senderJid));
        if (isUserMuted) {
            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key });
            }
            return; 
        }
    }

    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        await events(conn, m, metadata.participants || []);
        return;
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || m.mtype == 'templateButtonReplyMessage' && m.msg.selectedId || m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId || m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId || '').trim();

    if (!msgText && !m.messageStubType && !m.msg?.image && !m.msg?.video && !m.msg?.audio && !m.msg?.sticker && !m.msg?.document && !m.msg?.location && !m.msg?.viewOnceMessageV2) return; 

    const isMainBot = jidNormalizedUser(conn.user.id) === jidNormalizedUser(global.conn?.user?.id);

    if (m.isGroup && chat?.antisub === true) {
        if (!isMainBot) return;
    }

    const allPlugins = global.plugins instanceof Map ? Array.from(global.plugins.values()) : Object.values(global.plugins);
    for (const plugin of allPlugins) {
        if (plugin?.before && typeof plugin.before === 'function') {
            try {
                if (await plugin.before.call(this, m, { 
                    conn, isAdmin, isBotAdmin, isOwner: isROwner, isROwner, participants, chat, user 
                })) return;
            } catch (e) {
                console.error(chalk.red(`Error en before de ${plugin.name}:`), e);
            }
        }
    }

    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));

    if (!usedPrefix) return; 

    if (m.isGroup && chat?.modoadmin && !isAdmin && !isROwner) {
        return; 
    }

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    const pluginName = global.plugins instanceof Map 
        ? (global.plugins.has(command) ? command : global.aliases.get(command))
        : (global.plugins[command] ? command : Object.keys(global.plugins).find(k => global.plugins[k].alias && global.plugins[k].alias.includes(command)));

    const plugin = global.plugins instanceof Map ? global.plugins.get(pluginName) : global.plugins[pluginName];

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;

        const checkPermissions = (perm) => ({
            rowner: isROwner, owner: isROwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup
        }[perm]);

if (plugin.nsfw && !chat?.nsfw && !isROwner) {
    global.dfail('nsfw', m, conn);
    return;
}


        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

                try {
            if (global.Stats) {
                const cmdName = plugin.name || command;
                const groupKey = m.chat.replace(/\./g, '_');
                
                await global.Stats.findOneAndUpdate(
                    { command: cmdName },
                    { 
                        $inc: { 
                            globalUsage: 1, 
                            [`groups.${groupKey}`]: 1 
                        } 
                    },
                    { upsert: true }
                ).catch(() => null);
            }

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
        nsfw: `> ╰❒ El contenido NSFW está desactivado en este grupo.`,
        botAdmin: `> ╰✰ Necesito ser administrador.`,
    };
    if (messages[type] && m.chat) conn.reply(m.chat, messages[type], m).catch(() => null);
};
