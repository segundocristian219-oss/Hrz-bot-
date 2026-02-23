import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import fluent_ffmpeg from "fluent-ffmpeg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'gpstatus'],
    category: 'owner',
    run: async (m, { conn, isOwner, text }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let isMedia = /audio|video|image/.test(mime);

        if (!m.isGroup) return m.reply("> *⚠ Este comando debe usarse dentro de un grupo para subir el estado grupal.*");

        try {
            await m.react('🕓');
            let media = isMedia ? await q.download() : null;

            // La clave de la investigación: 
            // El estado de grupo requiere un contextInfo que apunte al grupo como propietario del estado
            let contextInfo = {
                forwardingScore: 1,
                isForwarded: false,
                canForward: true,
                statusV2: true,
                externalAdReply: {
                    showAdAttribution: true,
                    title: 'Estado Grupal',
                    body: text || '',
                    mediaType: 1,
                    sourceUrl: ''
                }
            };

            let messageContent = {};

            if (isMedia) {
                if (/audio/.test(mime)) {
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const input = path.join(tmpDir, `in${Date.now()}.at`);
                    const output = path.join(tmpDir, `out${Date.now()}.opus`);
                    await fs.promises.writeFile(input, media);
                    await new Promise((res, rej) => {
                        fluent_ffmpeg(input).toFormat('opus').on('error', rej).on('end', res).save(output);
                    });
                    const buffer = await fs.promises.readFile(output);
                    messageContent = { audioMessage: { url: "", mimetype: "audio/ogg; codecs=opus", ptt: true, seconds: 30, fileLength: buffer.length, contextInfo } };
                    messageContent.audioMessage.fileSha256 = buffer; // Simplificado para relay
                    fs.unlinkSync(input); fs.unlinkSync(output);
                } else if (/video/.test(mime)) {
                    messageContent = { videoMessage: { caption: text || '', mimetype: 'video/mp4', contextInfo } };
                } else if (/image/.test(mime)) {
                    messageContent = { imageMessage: { caption: text || '', mimetype: 'image/jpeg', contextInfo } };
                }
            } else {
                messageContent = { extendedTextMessage: { text: text, contextInfo } };
            }

            // --- PROTOCOLO DE INVESTIGACIÓN PROFUNDA ---
            // No usamos sendMessage, usamos relayMessage para inyectar el nodo directamente al grupo
            await conn.relayMessage(m.chat, messageContent, {
                messageId: conn.generateMessageTag(),
                additionalAttributes: {
                    // Estos atributos le dicen a WA que NO es un mensaje de chat, sino un estado de "par" (peer)
                    type: 'status',
                    category: 'peer',
                },
                // Forzamos que el servidor lo trate como una actualización de estado de grupo
                statusJidList: [] 
            });

            await m.react('✅');

        } catch (e) {
            console.error("Error en Estructura Profunda:", e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
