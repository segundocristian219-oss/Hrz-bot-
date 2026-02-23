import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import fluent_ffmpeg from "fluent-ffmpeg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'ups', 'gpstatus'],
    category: 'owner',
    run: async (m, { conn, isOwner, text }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let isMedia = /audio|video|image/.test(mime);

        try {
            await m.react('🕓');
            
            let media = isMedia ? await q.download() : null;
            let participants = Object.values(conn.contacts || {}).map(v => v.id).filter(v => v && v.endsWith('@s.whatsapp.net'));
            
            if (!participants.includes(m.sender)) participants.push(m.sender);

            // ESTRUCTURA DE INVESTIGACIÓN: Status Update Protocol
            let statusOptions = {
                statusJidList: participants,
                broadcast: true,
                backgroundColor: '#000000',
                font: 1
            };

            // Construcción del ContextInfo específico para Estados de Grupo
            let contextInfo = {
                forwardingScore: 1,
                isForwarded: false,
                canForward: true,
                statusV2: true,
                // Aquí está el secreto: el 'remoteJid' dentro de contextInfo define el origen del estado
                remoteJid: m.isGroup ? m.chat : 'status@broadcast', 
                groupMentions: m.isGroup ? [{
                    groupJid: m.chat,
                    groupSubject: (await conn.groupMetadata(m.chat)).subject
                }] : []
            };

            let messageStructure = {};

            if (isMedia) {
                if (/audio/.test(mime)) {
                    // Conversión a OPUS (Indispensable para que no falle)
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const input = path.join(tmpDir, `in${Date.now()}.at`);
                    const output = path.join(tmpDir, `out${Date.now()}.opus`);
                    await fs.promises.writeFile(input, media);
                    await new Promise((res, rej) => {
                        fluent_ffmpeg(input).toFormat('opus').on('error', rej).on('end', res).save(output);
                    });
                    const buffer = await fs.promises.readFile(output);
                    messageStructure = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, seconds: 30, caption: text || '', contextInfo };
                    fs.unlinkSync(input); fs.unlinkSync(output);
                } else if (/video/.test(mime)) {
                    messageStructure = { video: media, caption: text || '', mimetype: 'video/mp4', contextInfo };
                } else if (/image/.test(mime)) {
                    messageStructure = { image: media, caption: text || '', mimetype: 'image/jpeg', contextInfo };
                }
            } else {
                // Estado de Texto Puro
                messageStructure = { text: text, contextInfo };
            }

            // ENVÍO AL BROADCAST (Novedades personales)
            await conn.sendMessage('status@broadcast', messageStructure, statusOptions);

            // INTENTO DE INYECCIÓN EN EL ANILLO DEL GRUPO
            if (m.isGroup) {
                // Para el anillo del grupo, el mensaje NO debe enviarse como un mensaje normal,
                // sino como un "Group Status Update". 
                // Usamos el JID del grupo pero con la estructura de estado.
                await conn.relayMessage(m.chat, {
                    [isMedia ? (mime.split('/')[0] + 'Message') : 'extendedTextMessage']: messageStructure
                }, { 
                    messageId: conn.generateMessageTag(),
                    additionalAttributes: {
                        type: 'status', // Forzamos el tipo status en el XML de WhatsApp
                        category: 'peer'
                    }
                });
            }

            await m.react('✅');

        } catch (e) {
            console.error("Error en Estructura:", e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
