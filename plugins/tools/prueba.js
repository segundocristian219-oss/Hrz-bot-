import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import fluent_ffmpeg from "fluent-ffmpeg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const groupStatusCommand = {
    name: 'setstatus',
    alias: ['estado', 'gpstatus'],
    category: 'owner',
    run: async (m, { conn, isOwner, text }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);
        if (!m.isGroup) return m.reply("> *⚠ Úsalo en un grupo.*");

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let isMedia = /audio|video|image/.test(mime);

        try {
            await m.react('🕓');
            let media = isMedia ? await q.download() : null;

            // Construimos el mensaje interno
            let innerMessage = {};
            
            if (isMedia) {
                if (/image/.test(mime)) {
                    innerMessage.imageMessage = { url: "", caption: text || '', mimetype: 'image/jpeg' };
                    // Aquí Baileys normalmente sube la imagen y llena la URL, 
                    // pero al hacerlo manual necesitamos que el 'conn' procese el media.
                } else if (/video/.test(mime)) {
                    innerMessage.videoMessage = { caption: text || '', mimetype: 'video/mp4' };
                }
            } else {
                innerMessage.extendedTextMessage = { text: text, backgroundArgb: 0xff000000 };
            }

            // --- INYECCIÓN MANUAL DE NODO ---
            // En lugar de sendMessage directo, enviamos un relay con el nodo groupStatusMessage
            await conn.relayMessage(m.chat, {
                groupStatusMessage: {
                    // Re-empaquetamos el contenido
                    ...(isMedia ? { 
                        [mime.split('/')[0] + 'Message']: (await conn.prepareWAMessageMedia({ [mime.split('/')[0]]: media }, { upload: conn.waUploadToServer })).imageMessage || 
                                                           (await conn.prepareWAMessageMedia({ [mime.split('/')[0]]: media }, { upload: conn.waUploadToServer })).videoMessage
                    } : { 
                        extendedTextMessage: innerMessage.extendedTextMessage 
                    })
                }
            }, { messageId: conn.generateMessageTag() });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            // Si el relay falla, intentamos el método de respaldo "invisible"
            try {
                await conn.sendMessage(m.chat, {
                    text: text || '',
                    contextInfo: {
                        externalAdReply: {
                            title: 'ESTADO GRUPAL',
                            body: 'Toca para ver',
                            mediaType: 1,
                            sourceUrl: '',
                            thumbnail: isMedia ? media : null
                        },
                        // Flag para intentar forzar el anillo
                        statusV2: true
                    }
                });
                await m.react('✅');
            } catch (err) {
                await m.react('✖️');
                m.reply(`> *❌ El protocolo de tu Baileys oficial aún no reconoce 'groupStatusMessage'.*`);
            }
        }
    }
}

export default groupStatusCommand;
