import { jidNormalizedUser, getContentType, proto, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, delay, jidDecode, generateForwardMessageContent } from '@whiskeysockets/baileys';
import { getRealJid, resolveMentions } from './identifier.js';
import fs from 'fs';
import { Buffer } from 'buffer';
import axios from 'axios';

export const smsg = async (conn, m) => {
    if (!m) return m;

    if (!conn.downloadM) {
        conn.downloadM = async (message, type) => {
            if (!message) return Buffer.from([]);
            try {
                let stream = await downloadContentFromMessage(message, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                return buffer;
            } catch {
                return Buffer.from([]);
            }
        };

        conn.getFile = async (PATH, save) => {
            let res;
            let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? (res = await axios.get(PATH, { responseType: 'arraybuffer' })).data : fs.existsSync(PATH) ? (res = fs.readFileSync(PATH), PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
            let type = res ? { mime: res.headers ? res.headers['content-type'] : 'image/png' } : { mime: 'image/png' };
            let filename = `file_${Date.now()}.${type.mime.split('/')[1]}`;
            if (data && save) fs.writeFileSync(filename, data);
            return { res, filename, data, ...type };
        };

        conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
            let type = await conn.getFile(path, true);
            let { data: file, mime: mimetype } = type;
            let mtype = '';
            if (/webp/.test(mimetype)) mtype = 'sticker';
            else if (/image/.test(mimetype)) mtype = 'image';
            else if (/video/.test(mimetype)) mtype = 'video';
            else if (/audio/.test(mimetype)) mtype = ptt ? 'ptt' : 'audio';
            else mtype = 'document';
            return await conn.sendMessage(jid, { [mtype]: file, caption, mimetype, fileName: filename, ...options }, { quoted, ...options });
        };

        conn.generateWAMessageFromContent = generateWAMessageFromContent;
        conn.generateWAMessage = generateWAMessage;
        conn.prepareWAMessageMedia = prepareWAMessageMedia;
        conn.delay = delay;

        conn.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            }
            return jid;
        };

        conn.getName = (jid, some) => {
            let id = conn.decodeJid(jid);
            some = id.endsWith('@g.us');
            if (!some) {
                let v = id === conn.user.id ? conn.user : ((conn.contacts ? conn.contacts[id] : {}) || {});
                return v.name || v.subject || v.verifiedName || v.notify || v.pushName || id.split('@')[0];
            } else {
                let group = global.groupCache instanceof Map ? global.groupCache.get(id) : null;
                if (group) return group.subject;
                return id.split('@')[0];
            }
        };

        conn.parseMention = (text = '') => {
            if (!text || typeof text !== 'string') return [];
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
        };

        conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
            if (!message || !message.message) return;
            let vtype;
            if (options.readViewOnce) {
                message.message = message.message?.ephemeralMessage?.message || message.message || undefined;
                if (message.message?.viewOnceMessage?.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    delete(message.message?.viewOnceMessage?.message[vtype]?.viewOnce);
                    message.message = { ...message.message.viewOnceMessage.message };
                }
            }
            let mtype = Object.keys(message.message)[0];
            let content = await generateForwardMessageContent(message, forceForward);
            if (!content) return;
            let ctype = Object.keys(content)[0];
            let context = {};
            if (mtype != "conversation") context = message.message[mtype]?.contextInfo || {};
            content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
            const waMessage = generateWAMessageFromContent(jid, content, options ? { ...options, ...(context ? { contextInfo: { ...context, ...options.contextInfo } } : {}) } : {});
            await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
            return waMessage;
        };

        conn.reply = (jid, text = '', quoted, options) => {
            if (!text) return;
            return conn.sendMessage(jid, { text: text.trim(), mentions: conn.parseMention(text) }, { quoted: quoted || m, ...options });
        };
    }

    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us') ?? false;

        // En grupos: participant es quien envió
        // En privado: remoteJid es quien envió (nunca participant)
        // fromMe: el sender es el bot
        if (m.fromMe) {
            m.sender = jidNormalizedUser(conn.user.id)
        } else if (m.isGroup) {
            // En grupos siempre hay participant
            const rawParticipant = m.key.participant || m.participant
            m.sender = await getRealJid(conn, rawParticipant, m)
        } else {
            // Privado: remoteJid es el sender, puede venir como @lid
            const rawRemote = m.key.remoteJid
            if (rawRemote?.endsWith('@lid')) {
                m.sender = await getRealJid(conn, rawRemote, m)
            } else {
                m.sender = jidNormalizedUser(rawRemote)
            }
        }

        // Fallback por si sender quedó null o @lid
        if (!m.sender || m.sender.endsWith('@lid')) {
            m.sender = jidNormalizedUser(conn.user.id)
        }

        m.author = m.sender
        m.pushName = m.pushName || m.verifiedName || conn.getName(m.sender)
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessageV2') ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
        m.text = (m.msg?.text || m.msg?.caption || m.msg?.contentText || m.message?.conversation || m.msg?.selectedDisplayText || m.msg?.title || '').trim();

        m.download = () => conn.downloadM(m.msg, m.mtype.replace('Message', ''));

        const rawMentions = m.msg?.contextInfo?.mentionedJid || [];
        m.mentionedJid = await resolveMentions(conn, rawMentions, m);

        m.mentionedNames = await Promise.all(m.mentionedJid.map(async (jid) => {
            let name = conn.getName(jid);
            if (name.includes('@') || /^\d+$/.test(name)) {
                let userDb = await global.User?.findOne({ id: jid }).catch(() => null);
                return userDb?.name || name;
            }
            return name;
        }));

        if (m.msg?.contextInfo?.quotedMessage) {
            const ctx = m.msg.contextInfo
            m.quoted = {
                key: {
                    remoteJid: m.chat,
                    fromMe: jidNormalizedUser(ctx.participant) === jidNormalizedUser(conn.user.id),
                    id: ctx.stanzaId,
                    participant: ctx.participant
                },
                message: ctx.quotedMessage
            }

            m.quoted.mtype = getContentType(m.quoted.message)
            m.quoted.msg = m.quoted.message[m.quoted.mtype]
            m.quoted.text = (m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.contentText || m.quoted.message?.conversation || '').trim()

            // Resolver sender del quoted también sin @lid
            const rawQuotedAuthor = ctx.participant
            if (rawQuotedAuthor?.endsWith('@lid')) {
                m.quoted.sender = await getRealJid(conn, rawQuotedAuthor, m)
            } else {
                m.quoted.sender = rawQuotedAuthor ? jidNormalizedUser(rawQuotedAuthor) : m.sender
            }

            if (!m.quoted.sender || m.quoted.sender.endsWith('@lid')) {
                m.quoted.sender = m.sender
            }

            m.quoted.author = m.quoted.sender

            const quotedUser = await global.User?.findOne({ id: m.quoted.sender }).catch(() => null)
            m.quoted.pushName = quotedUser?.name || conn.getName(m.quoted.sender) || ctx.pushName || m.quoted.sender.split('@')[0]
            m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''))
        } else {
            m.quoted = null
        }
    }

    m.reply = (text, chat = m.chat, options = {}) => {
        if (!text) return;
        return conn.reply(chat, text, m, options);
    };

    m.react = (emoji) => {
        if (!emoji) return;
        return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    };

    return m;
};
