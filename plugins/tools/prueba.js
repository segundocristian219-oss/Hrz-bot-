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

            let messageContent = {};

            if (isMedia) {
                if (/image/.test(mime)) {
                    const upload = await conn.prepareWAMessageMedia({ image: media }, { upload: conn.waUploadToServer });
                    messageContent = { 
                        imageMessage: upload.imageMessage,
                        caption: text || ''
                    };
                } else if (/video/.test(mime)) {
                    const upload = await conn.prepareWAMessageMedia({ video: media }, { upload: conn.waUploadToServer });
                    messageContent = { 
                        videoMessage: upload.videoMessage,
                        caption: text || ''
                    };
                } else if (/audio/.test(mime)) {
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const input = path.join(tmpDir, `in${Date.now()}.at`);
                    const output = path.join(tmpDir, `out${Date.now()}.opus`);
                    await fs.promises.writeFile(input, media);
                    await new Promise((res, rej) => {
                        fluent_ffmpeg(input).toFormat('opus').on('error', rej).on('end', res).save(output);
                    });
                    const buffer = await fs.promises.readFile(output);
                    const upload = await conn.prepareWAMessageMedia({ audio: buffer, mimetype: 'audio/ogg; codecs=opus' }, { upload: conn.waUploadToServer });
                    messageContent = { 
                        audioMessage: upload.audioMessage
                    };
                    fs.unlinkSync(input); 
                    fs.unlinkSync(output);
                }
            } else {
                messageContent = { 
                    extendedTextMessage: { 
                        text: text, 
                        backgroundArgb: 0xff000000,
                        font: 1 
                    } 
                };
            }

            await conn.relayMessage(m.chat, {
                groupStatusMessage: messageContent
            }, { 
                messageId: conn.generateMessageTag(),
                additionalAttributes: {
                    category: 'peer',
                    type: 'status'
                }
            });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default groupStatusCommand;
