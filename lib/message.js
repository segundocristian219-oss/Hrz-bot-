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
    
    // Carga ultra rápida de DB
    if (!global.db.data) await global.loadDatabase();
    const db = global.db.data;
    
    const chatJid = m.chat;
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';
    const senderJid = await getRealJid(conn, m.sender, m);
    const botJid = jidNormalizedUser(conn.user.id);
    const isSubBot = (global.conns || []).some(c => c.user && cleanId(c.user.id) === cleanId(botJid));
    const isMainBot = !isSubBot;

    // Inicialización rápida de datos
    db.chats[chatJid] ||= { 
        isBanned: false, 
        welcome: true, 
        detect: true, 
        antisub: false,
        mutos: [],
        gacha: false
    };
    db.groupGacha ||= {};
    db.users[m.sender] ||= { exp: 0, muto: false, warnAntiLink: 0 };

    const prefixes = ['#', '.', '/', '!'];
    const usedPrefix = prefixes.find(p => m.text && m.text.startsWith(p));

    if (!usedPrefix) return;

    const textAfterPrefix = m.text.slice(usedPrefix.length).trim();
    const [commandName, ...args] = textAfterPrefix.split(/\s+/);
    const command = (commandName || '').toLowerCase();
    const text = args.join(' ').trim();

    const chat = db.chats[chatJid];
    let participants = [];
    let groupMetadata = {};
    
    if (m.isGroup) {
        groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
    }
    
    if (m.messageStubType) {
        const parts = m.isGroup ? (await getGroupMetadata(conn, m.chat)).participants || [] : [];
        await events(conn, m, parts);
        return;
    }
    
    if (m.isGroup && !isMainBot && chat.antisub) return;
    if (m.isBaileys) return;

    const user = db.users[m.sender];
    const isROwner = global.owner.some(([num]) => num.replace(/\D/g, '') === cleanId(senderJid)) || m.fromMe;
    const isOwner = isROwner;
    
    let isAdmin = false, isBotAdmin = false;
    if (m.isGroup && participants.length > 0) {
        const getAdminStatus = (targetJid) => {
            const p = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetJid)));
            return !!(p?.admin || p?.isCommunityAdmin);
        };
        isAdmin = getAdminStatus(m.sender);
        isBotAdmin = getAdminStatus(conn.user.id);
    }

    if (m.isGroup && chat.mutos.includes(senderJid)) {
        if (!isAdmin && isBotAdmin) {
            await conn.sendMessage(m.chat, { delete: m.key });
            return;
        }
    }

    if (!command) return;
    
    // Búsqueda de plugin optimizada
    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    const plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;
        if (plugin.text && !text) {
            return conn.reply(m.chat, `*｢ ℹ️ INFO ｣*\n\nSolicitud incompleta. Por favor, proporcione un texto o término de búsqueda.\n\n*Ejemplo:* _${usedPrefix}${command} Hola_`, m);
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
            const report = `*｢ ⚠️ SYSTEM ERROR ｣*\n\n` +
                           `*ID:* \`#${errorId}\`\n` +
                           `*Estado:* Fallo técnico detectado\n\n` +
                           `*Detalle:* \`\`\`${errorMessage}\`\`\``;
            await conn.sendMessage(m.chat, { text: report }, { quoted: m }).catch(() => null);
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `/t/t/t/t*｢ ACCESO RESTRINGIDO ｣*\n\nEsta función es exclusiva para el desarrollador principal del sistema.`,
        owner: `/t/t/t/t*｢ PROPIETARIO ｣*\n\nSolo el propietario del bot tiene autorización para ejecutar este comando.`,
        group: `/t/t/t/t*｢ GRUPOS ｣*\n\nEsta función solo se encuentra disponible dentro de chats grupales.`,
        private: `/t/t/t/t*｢ CHAT PRIVADO ｣*\n\nPor favor, ejecute este comando a través de mi chat privado para continuar.`,
        admin: `/t/t/t/t*｢ ADMINISTRACIÓN ｣*\n\nAcceso denegado. Se requieren privilegios de administrador del grupo.`,
        botAdmin: `/t/t/t/t*｢ BOT STATUS ｣*\n\nPara ejecutar esta acción, el bot debe tener asignado el rol de administrador.`,
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m).catch(() => null);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.cyanBright(`[SYSTEM] Sincronización de archivos completada.`));
});
