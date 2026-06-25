import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { databaseManager } from '../database/db_adapter.js';
import { dfail } from './event/dfail.js';

const __filename = fileURLToPath(import.meta.url);

const cleanJid = (jid) => {
    if (!jid) return '';
    const [user, server] = jid.split('@');
    return `${user.split(':')[0]}@${server || 's.whatsapp.net'}`;
};

async function getGroupDataLive(conn, chatJid, cleanSenderId, botJid) {
    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;
    try {
        let groupMetadata = global.groupCache ? global.groupCache.get(chatJid) : null;
        if (!groupMetadata) {
            groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
            if (groupMetadata && global.groupCache) {
                global.groupCache.set(chatJid, groupMetadata);
            }
        }
        participants = groupMetadata?.participants || [];
        const adminRoles = ['admin', 'superadmin'];
        const numSender = cleanSenderId.split('@')[0].replace(/\D/g, '');
        const numBot = botJid.split('@')[0].replace(/\D/g, '');

        const userParticipant = participants.find(p => {
            const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
            return pNum === numSender;
        });
        isAdmin = userParticipant ? adminRoles.includes(userParticipant.admin || userParticipant.isSuperAdmin ? 'superadmin' : userParticipant.isAdmin ? 'admin' : userParticipant.admin) : false;

        const botParticipant = participants.find(p => {
            const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
            return pNum === numBot;
        });
        isBotAdmin = botParticipant ? adminRoles.includes(botParticipant.admin || botParticipant.isSuperAdmin ? 'superadmin' : botParticipant.isAdmin ? 'admin' : botParticipant.admin) : false;
    } catch {}
    return { participants, isAdmin, isBotAdmin };
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m || !conn?.user) return;

    const botJid = cleanJid(conn.user.id);
    const currentChatJid = cleanJid(m.chat);
    if (!m.isGroup && currentChatJid === botJid) return;

    const mTimestamp = (m.messageTimestamp?.low || m.messageTimestamp || 0) * 1000;
    if (Date.now() - mTimestamp > 8000) return;

    const isMainBot = botJid === (global.conn?.user?.id ? cleanJid(global.conn.user.id) : '');
    const realSenderId = await getRealJid(conn, m.sender, m);

    if (!global.subbotConfig) global.subbotConfig = {};
    if (!global.subbotConfig[botJid] && !isMainBot) {
        const sData = await databaseManager.getActiveSubBots().then(bots => bots.find(b => b.botId === botJid)).catch(() => null);
        if (sData) global.subbotConfig[botJid] = sData;
    }

    const botSettings = global.subbotConfig[botJid] || { 
        prefix: isMainBot ? ['.', '#', '/', '!'] : ['.'], 
        isprem: false,
        modulos: { antiprivado: false }
    };
    conn.settings = botSettings;

    if (typeof m.text !== 'string') m.text = '';
    const quotedText = m.quoted ? (m.quoted.text || '') : '';
    const fullTextSearch = `${m.text} ${quotedText}`.trim();

    const activePrefixes = conn.settings?.prefix 
        ? (Array.isArray(conn.settings.prefix) ? conn.settings.prefix : [conn.settings.prefix])
        : ['.', '#', '/', '!'];

    let usedPrefix = activePrefixes.find(p => m.text.startsWith(p));

    if (!m.sender.endsWith('@s.whatsapp.net') && !m.sender.endsWith('@lid')) return;

    const cleanSenderId = cleanJid(realSenderId);
    const senderNumber = cleanSenderId.split('@')[0];

    let isROwner = global.owner ? global.owner.some(ownerItem => {
        if (!ownerItem) return false;
        if (Array.isArray(ownerItem)) {
            return ownerItem[0] ? ownerItem[0].replace(/\D/g, '') === senderNumber : false;
        }
        if (typeof ownerItem === 'string') {
            return ownerItem.replace(/\D/g, '') === senderNumber;
        }
        return false;
    }) : false;

    const isSelf = cleanSenderId === botJid || m.fromMe;

    let chat = null;
    let user = null;
    let initialUserSnapshot = null;

    try {

if (m?.isGroup && global.Chat) {
    chat = await global.Chat.findOne({ id: m.chat }).lean().catch(() => null);
    if (!chat) {
        chat = await global.Chat.create({
            id: m.chat, isBanned: false, welcome: true, muto: false, antiLink: true,
            antiLink2: false, antiCall: false, modoadmin: false, antisub: false, antiBots: false,
            mutos: [], nsfw: false, antiStatus: false, antiToxic: true, warns: [],
            botAsignado: ''
        }).catch(() => null);
    }
}

        if (global.userCache && global.User) {
            user = global.userCache.get(realSenderId);
            if (!user && (usedPrefix || m.isGroup)) {
                user = await global.User.findOne({ id: realSenderId }).lean().catch(() => null);
                if (!user && usedPrefix) {
                    user = await global.User.create({
                        id: realSenderId, name: m.pushName || "Usuario", warnAntiLink: 0, banned: false, lastSeen: new Date()
                    }).catch(() => null);
                }
                if (user) global.userCache.set(realSenderId, user);
            }
            if (user) initialUserSnapshot = JSON.stringify(user);
        }
    } catch (e) {}

    if (m.isGroup && chat?.botAsignado && chat.botAsignado !== botJid && !isMainBot) return;

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup && chat && !isROwner) {
        if (chat.muto || (chat.mutos && chat.mutos.includes(realSenderId))) {
            const cachedMetadata = global.groupCache ? global.groupCache.get(m.chat) : null;
            let currentBotAdminStatus = false;
            if (cachedMetadata) {
                const adminRoles = ['admin', 'superadmin'];
                const numBot = botJid.split('@')[0].replace(/\D/g, '');
                const botParticipant = cachedMetadata.participants?.find(p => (p.phoneNumber || p.id.split('@')[0]).replace(/\D/g, '') === numBot);
                currentBotAdminStatus = botParticipant ? adminRoles.includes(botParticipant.admin) : false;
            }
            if (currentBotAdminStatus) {
                await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                return;
            }
        }
    }

    if (m.isGroup && chat?.antisub && !isMainBot) return;

    if (global.commands) {
        for (const plugin of global.commands.values()) {
            if (plugin && typeof plugin.before === 'function') {
                try {
                    const blockExecution = await plugin.before.call(conn, m, {
                        conn,
                        isOwner: isROwner,
                        chat,
                        user,
                        isROwner,
                        isAdmin,
                        isBotAdmin,
                        participants,
                        isSelf,
                        settings: conn.settings || {}
                    });
                    if (blockExecution === true) return;
                } catch (e) {
                    console.error('Error al ejecutar hook before:', e);
                }
            }
        }
    }

    let checkCmd = usedPrefix ? m.text.slice(usedPrefix.length).trim().split(/\s+/)[0].toLowerCase() : m.text.trim().split(/\s+/)[0].toLowerCase();

    const isActualCommand = global.commands.has(checkCmd) || global.aliases.has(checkCmd);
    const commandName = global.commands.has(checkCmd) ? checkCmd : global.aliases.get(checkCmd);
    const cmd = global.commands.get(commandName);

    let esComandoLibre = cmd?.libre === true;

    if (!usedPrefix && !isActualCommand) return;
    if (!usedPrefix && isActualCommand && !esComandoLibre) return;

    if (user?.banned && !isROwner) {
        if (!global.banCooldown) global.banCooldown = new Map();
        const now = Date.now();
        if (now - (global.banCooldown.get(m.sender) || 0) > 30000) {
            global.banCooldown.set(m.sender, now);
            await conn.sendMessage(m.chat, { text: `⚠️ *ACCESO RESTRINGIDO*${user.banReason ? `\n\n*Razón:* ${user.banReason}` : ''}` }, { quoted: m }).catch(() => null);
        }
        return;
    }

    if (m.isGroup && chat?.modoadmin && !isROwner) {
        const gData = await getGroupDataLive(conn, m.chat, cleanSenderId, botJid);
        if (!gData.isAdmin) return;
        participants = gData.participants;
        isAdmin = gData.isAdmin;
        isBotAdmin = gData.isBotAdmin;
    }

    let noPrefix = usedPrefix ? m.text.slice(usedPrefix.length).trim() : m.text.trim();

    const isButtonInteraction = (m.mtype === 'templateButtonReplyMessage' || m.mtype === 'interactiveResponseMessage');
    if (!usedPrefix && isButtonInteraction) {
        noPrefix = noPrefix.startsWith('.') ? noPrefix.slice(1) : noPrefix;
    }

    const spaceIndex = noPrefix.search(/[\s\n]/);
    let command = '';
    let text = '';
    let args = [];

    if (spaceIndex === -1) {
        command = noPrefix.toLowerCase();
    } else {
        command = noPrefix.slice(0, spaceIndex).toLowerCase();
        text = noPrefix.slice(spaceIndex).trim();
        args = text.split(/\s+/).filter(Boolean);
    }

    if (!m.isGroup && conn.settings?.modulos?.antiprivado && isActualCommand && !isROwner && !isSelf) {
        const txtAntiPrivado = `> ❒ *SISTEMA ANTI-PRIVADO*\n\nHola @${m.sender.split('@')[0]}, las funciones de este bot están disponibles únicamente en grupos. Está prohibido escribir al privado.\n\n*Serás bloqueado automáticamente.*`;
        await conn.sendMessage(m.chat, { text: txtAntiPrivado, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m }).catch(() => null);
        await conn.updateBlockStatus(realSenderId, 'block').catch(() => null);
        return;
    }

    if (chat?.isBanned && command !== 'bot' && command !== 'enable' && command !== 'onchat') return;

    if (global.restrictionsCache) {
        const hasDBRestriction = global.restrictionsCache.has(botJid);
        if (hasDBRestriction) {
            const restrictionData = global.restrictionsCache.get(botJid);
            if (restrictionData && restrictionData.restrictedMode) {
                const restrictionOwner = restrictionData.owner || restrictionData.ownerNumber || '';
                const cleanRestrictionOwner = restrictionOwner ? restrictionOwner.replace(/\D/g, '') : '';
                const isSubbotOwner = cleanRestrictionOwner && cleanRestrictionOwner === senderNumber;
                const configOwner = botSettings.owner || '';
                const cleanConfigOwner = configOwner ? configOwner.replace(/\D/g, '') : '';
                const isConfigOwner = cleanConfigOwner && cleanConfigOwner === senderNumber;
                if (isSubbotOwner || isConfigOwner) isROwner = true;
                conn.settings.isprem = true;
            }
        }
    }

    if (typeof global.isCommandAllowed === 'function') {
        if (!global.isCommandAllowed(conn, commandName)) return;
    }

    if (cmd) {
        if (cmd.mainOnly && !isMainBot) return conn.reply(m.chat, `> ❒ Este comando solo funciona en el bot principal.`, m);
        if (cmd.isPrem && !conn.settings?.isprem) {
            dfail('isPrem', m, conn);
            return;
        }

        if (m.isGroup && (cmd.admin || cmd.botAdmin || !participants.length)) {
            const gData = await getGroupDataLive(conn, m.chat, cleanSenderId, botJid);
            participants = gData.participants;
            isAdmin = gData.isAdmin;
            isBotAdmin = gData.isBotAdmin;
        }

        const checkPermissions = (perm) => ({ rowner: isROwner, owner: isROwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup, self: isSelf }[perm]);
        if (cmd.nsfw && !chat?.nsfw) {
            dfail('nsfw', m, conn);
            return;
        }
        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'self']) {
            if (cmd[perm] && !checkPermissions(perm)) {
                dfail(perm, m, conn);
                return;
            }
        }
        try {
            await conn.readMessages([m.key]).catch(() => null);

            if (cmd.run && typeof cmd.run === 'function') {
                await cmd.run.call(conn, m, { usedPrefix, noPrefix, args, command: checkCmd, text, conn, user, chat, isROwner, isAdmin, isBotAdmin, participants, isSelf, settings: conn.settings || {} });
            }

            if (user && usedPrefix && global.userCache) {
                global.userCache.set(realSenderId, user);
                const finalUserSnapshot = JSON.stringify(user);
                if (initialUserSnapshot !== finalUserSnapshot) {
                    if (typeof global.updateUser === 'function') global.updateUser(realSenderId, user);
                }
            }
        } catch (e) { 
            const errorReport = `❌ *REPORT DE ERROR INTERNO*\n\n` +
                                `• *Módulo:* message.js\n` +
                                `• *Comando:* ${commandName || 'Desconocido'}\n` +
                                `• *Error:* ${e.message}\n\n` +
                                `*Trazado de la pila (Stack):*\n\`\`\`${e.stack}\`\`\``;
            try {
                await conn.sendMessage(m.chat, { text: errorReport }, { quoted: m });
            } catch (sendError) {
                console.error('Incapaz de transmitir el reporte de error al chat de origen:', sendError);
            }
        }
    }
}

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright("Update 'message.js'"));
    if (typeof global.reloadModules === 'function') global.reloadModules();
});
