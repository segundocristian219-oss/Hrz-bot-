import { jidNormalizedUser, getContentType, proto, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, delay, jidDecode, generateForwardMessageContent } from '@whiskeysockets/baileys';
import { getRealJid, resolveMentions } from './identifier.js';
importar fs desde 'fs';
import { Buffer } from 'buffer';
importar axios desde 'axios';

export const smsg = async (conn, m) => {
    si (!m) devolver m;

    si (!conn.downloadM) {
        conn.downloadM = async (mensaje, tipo) => {
            Si (!mensaje) devuelve Buffer.from([]);
            intentar {
                let stream = await downloadContentFromMessage(message, type);
                let buffer = Buffer.from([]);
                para await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                devolver búfer;
            } atrapar {
                devolver Buffer.from([]);
            }
        };

        conn.getFile = async (PATH, save) => {
            dejar res;
            let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? (res = await axios.get(PATH, { responseType: 'arraybuffer' })).data : fs.existsSync(PATH) ? (res = fs.readFileSync(PATH), PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
            let type = res ? { mime: res.headers ? res.headers['content-type'] : 'image/png' } : { mime: 'image/png' };
            let filename = `file_${Date.now()}.${type.mime.split('/')[1]}`;
            Si (datos && guardar) fs.writeFileSync(nombre de archivo, datos);
            devolver { res, nombre de archivo, datos, ...tipo };
        };

        conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
            let type = await conn.getFile(path, true);
            let { datos: archivo, mime: tipo_mime } = tipo;
            let mtype = '';
            si (/webp/.test(mimetype)) mtype = 'sticker';
            else if (/image/.test(mimetype)) mtype = 'image';
            else if (/video/.test(mimetype)) mtype = 'video';
            else if (/audio/.test(mimetype)) mtype = ptt ? 'ptt' : 'audio';
            de lo contrario mtype = 'documento';

            return await conn.sendMessage(jid, {
                [mtype]: archivo,
                subtítulo,
                mimetipo,
                nombreArchivo: nombreArchivo,
                ...opciones
            }, { entre comillas, ...opciones });
        };

        conn.generateWAMessageFromContent = generateWAMessageFromContent;
        conn.generateWAMessage = generateWAMessage;
        conn.prepareWAMessageMedia = prepareWAMessageMedia;
        conn.delay = delay;

        conn.decodeJid = (jid) => {
            si (!jid) devolver jid;
            si (/:\d+@/gi.test(jid)) {
                decodificación constante = jidDecode(jid) || {};
                devolver decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } de lo contrario, devolver jid;
        };

        conn.getName = (jid, some) => {
            let id = conn.decodeJid(jid);
            algunos = id.endsWith('@g.us');
            si (!algunos) {
                let v = id === conn.user.id ? conn.user : ((conn.contacts ? conn.contacts[id] : {}) || {});
                return v.name || v.subject || v.verifiedName || v.notify || v.pushName || id.split('@')[0];
            } demás {
                let group = global.groupCache instanceof Map ? global.groupCache.get(id) : null;
                si (grupo) devolver grupo.sujeto;
                return id.split('@')[0];
            }
        };

        conexión.parseMention = (texto = '') => {
            if (!text || typeof text !== 'string') return [];
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
        };

        conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
            si (!mensaje || !mensaje.mensaje) regresar;
            sea ​​vtype;
            si (opciones.readViewOnce) {
                mensaje.mensaje = mensaje.mensaje?.mensajeefemeral?.mensaje || mensaje.mensaje || indefinido;
                si (mensaje.mensaje?.viewOnceMessage?.mensaje) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    eliminar(mensaje.mensaje?.viewOnceMensaje?.mensaje[vtype]?.viewOnce);
                    mensaje.mensaje = { ...mensaje.mensaje.viewOnceMessage.mensaje };
                }
            }
            let mtype = Object.keys(message.message)[0];
            let content = await generateForwardMessageContent(message, forceForward);
            si (!contenido) regresar;
            let ctype = Object.keys(content)[0];
            sea ​​contexto = {};
            if (mtype != "conversation") context = message.message[mtype]?.contextInfo || {};
            content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
            const waMessage = generateWAMessageFromContent(jid, content, options ? { ...options, ...(context ? { contextInfo: { ...context, ...options.contextInfo } } : {}) } : {});
            await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
            devolver waMessage;
        };

        conn.reply = (jid, texto = '', citado, opciones) => {
            si (!texto) regresar;
            return conn.sendMessage(jid, { text: text.trim(), mentions: conn.parseMention(text) }, { quoted: quoted || m, ...options });
        };
    }

    si (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') || m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.author = jidNormalizedUser(m.key.participant || m.key.remoteJid || m.participant || conn.user.id);
        m.sender = await getRealJid(conn, m.author, m);
        m.pushName = m.pushName || m.verifiedName || conn.getName(m.sender);
    }

    si (m.mensaje) {
        m.mtype = getContentType(m.message);
        si (m.mtype === 'protocolMessage' || m.mtype === 'senderKeyDistributionMessage') regresar;
        
        m.msg = (m.mtype === 'viewOnceMessageV2') ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
        
        si (!m.msg) regresar;

        let rawText = m.msg?.text || m.msg?.caption || m.msg?.contentText || m.message?.conversation || m.msg?.selectedDisplayText || m.msg?.title || '';
        m.text = typeof rawText === 'string' ? rawText.trim() : '';

        m.download = () => conn.downloadM(m.msg, m.mtype.replace('Message', ''));

        const rawMentions = m.msg?.contextInfo?.mentionedJid || [];
        m.mentionedJid = await resolveMentions(conn, rawMentions, m);

        m.mentionedNames = await Promise.all(m.mentionedJid.map(async (jid) => {
            let nombre = conn.getName(jid);
            if (name.includes('@') || /^\d+$/.test(name)) {
                let userDb = await global.User.findOne({ id: jid });
                devolver userDb?.name || name;
            }
            devolver nombre;
        }));

        m.quoted = m.msg?.contextInfo?.quotedMessage ? {
            llave: {
                remotoJid: m.chat,
                fromMe: m.msg.contextInfo.participant === jidNormalizedUser(conn.user.id),
                id: m.msg.contextInfo.stanzaId,
                participante: m.msg.contextInfo.participante
            },
            mensaje: m.msg.contextInfo.quotedMessage
        } : nulo;

        si (m.quoted) {
            m.quoted.mtype = getContentType(m.quoted.message);
            m.quoted.msg = m.quoted.message[m.quoted.mtype];
            si (m.quoted.msg) {
                let rawQuotedText = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.contentText || m.quoted.message?.conversation || '';
                m.quoted.text = typeof rawQuotedText === 'string' ? rawQuotedText.trim() : '';
                m.quoted.author = jidNormalizedUser(m.msg.contextInfo.participant);
                m.quoted.sender = await getRealJid(conn, m.quoted.author, m);
                const quotedUser = await global.User.findOne({ id: m.quoted.sender });
                m.quoted.pushName = quotedUser?.name || conn.getName(m.quoted.sender) || m.msg.contextInfo.pushName || m.quoted.sender.split('@')[0];
                m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''));
            }
        }
    }

    m.reply = (texto, chat = m.chat, opciones = {}) => {
        si (!texto) regresar;
        devolver conn.reply(chat, texto, m, opciones);
    };

    m.react = (emoji) => {
        si (!emoji) regresar;
        return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    };

    devolver m;
};