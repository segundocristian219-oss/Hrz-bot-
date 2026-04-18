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
        const data = await conn.groupMetadata(jid);
        if (data?.id) {
            if (global.groupCache instanceof Map) global.groupCache.set(jid, data);
            return data;
        }
    } catch { return global.groupCache?.get?.(jid) || {}; }
    return {};
}

const restrictedPrefixes = ['966', '967', '92', '212', '504', '91', '234', '20', '972'];
const restrictedCmds = ['creador', 'owner', 'contacto', 'devs', 'developer', 'desarrolladores', 'soporte'];

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
        if (m?.isGroup) {
            chat = await global.Chat.findOneAndUpdate(
                { id: chatJid },
                { 
                    $setOnInsert: { 
                        id: chatJid, isBanned: false, welcome: true, muto: false, 
                        detect: true, antiLink: true, modoadmin: false, 
                        autoStickers: false, antisub: false, mutos: [], 
                        nsfw: false, antiStatus: false, primaryBot: null
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
                    exp: 0, warnAntiLink: 0, col: 10, banned: false
                },
                $set: { lastSeen: new Date() }
            };
            user = await global.User.findOneAndUpdate(query, updateData, { upsert: true, new: true }).catch(() => null);
        }
    } catch (e) {
        console.error(chalk.red(`[DATABASE ERROR]`), e.message);
        return; 
    }

    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0].split(':')[0]) || m.fromMe;
    const botJid = jidNormalizedUser(conn.user.id);

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        let groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
        const getAdminStatus = (targetJid) => {
            const p = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
            return !!(p?.admin || p?.isCommunityAdmin);
        };
        isAdmin = getAdminStatus(m.sender);
        isBotAdmin = getAdminStatus(conn.user.id);
    }

    if (m.isGroup && chat && !isROwner) {
        const isUserMuted = chat.muto || (Array.isArray(chat.mutos) && chat.mutos.includes(senderJid));
        if (isUserMuted) {
            if (isBotAdmin) await conn.sendMessage(m.chat, { delete: m.key });
            return; 
        }
    }

    const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim();
    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => msgText.startsWith(p));

    if (!usedPrefix) return; 

    const noPrefix = msgText.slice(usedPrefix.length).trim();
    const [commandName, ...args] = noPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    // --- LÓGICA DE CONTROL DE FLUJO (BOT PRINCIPAL Y ESTADO) ---
    if (m.isGroup && chat) {
        // 1. Prioridad: Solo el Bot Primario responde (si está configurado)
        if (chat.primaryBot && chat.primaryBot !== botJid) {
            // Permitimos setprimary para poder cambiarlo después
            if (!['setprimary', 'botprincipal', 'estado', 'switch'].includes(command)) {
                return; 
            }
        }

        // 2. Estado: Si el sistema está suspendido (isBanned)
        if (chat.isBanned && !['estado', 'switch', 'bot', 'setprimary'].includes(command) && !isROwner) {
            return; 
        }
    }

    if (user?.banned && !isROwner) return;

    const pluginName = global.plugins instanceof Map 
        ? (global.plugins.has(command) ? command : global.aliases.get(command))
        : (global.plugins[command] ? command : Object.keys(global.plugins).find(k => global.plugins[k].alias && global.plugins[k].alias.includes(command)));

    const plugin = global.plugins instanceof Map ? global.plugins.get(pluginName) : global.plugins[pluginName];

    if (plugin) {
        if (plugin.disabled) return;
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
        rowner: `> ❒ Solo mi creador puede usar este comando.`,
        owner: `> ❒ Solo mi creador puede usar este comando.`,
        group: `> ✎ Este comando sólo se puede usar en grupos.`,
        admin: `> ♛ Sólo los administradores pueden ejecutar este comando.`,
        botAdmin: `> ✰ Necesito ser administrador.`
    };
    if (messages[type] && m.chat) conn.reply(m.chat, messages[type], m).catch(() => null);
};
                
