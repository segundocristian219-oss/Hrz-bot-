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
        if (!m.isGroup) return m.reply("> *⚠ Este comando solo funciona dentro de grupos.*");

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let isMedia = /audio|video|image/.test(mime);

        try {
            await m.react('🕓');
            let media = isMedia ? await q.download() : null;
            const groupJid = m.chat;

            let statusPayload = {};

            if (isMedia) {
                if (/image/.test(mime)) {
                    statusPayload = {
                        image: media,
                        caption: text || '',
                        backgroundColor: '#000000'
                    };
                } else if (/video/.test(mime)) {
                    statusPayload = {
                        video: media,
                        caption: text || '',
                        mimetype: 'video/mp4'
                    };
                } else if (/audio/.test(mime)) {
                    // Procesamiento de audio para asegurar compatibilidad
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const input = path.join(tmpDir, `in${Date.now()}.at`);
                    const output = path.join(tmpDir, `out${Date.now()}.opus`);
                    
                    await fs.promises.writeFile(input, media);
                    await new Promise((res, rej) => {
                        fluent_ffmpeg(input)
                            .toFormat('opus')
                            .on('error', rej)
                            .on('end', res)
                            .save(output);
                    });

                    const audioBuffer = await fs.promises.readFile(output);
                    statusPayload = {
                        audio: audioBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ppt: true,
                        seconds: 30
                    };
                    
                    fs.unlinkSync(input);
                    fs.unlinkSync(output);
                }
            } else {
                // ESTADO DE SOLO TEXTO
                statusPayload = {
                    text: text,
                    backgroundColor: '#000000',
                    font: 1
                };
            }

            // LA ESTRUCTURA CLAVE: Usamos groupStatusMessage
            await conn.sendMessage(groupJid, {
                groupStatusMessage: statusPayload
            });

            await m.react('✅');

        } catch (e) {
            console.error("Error subiendo estado grupal:", e);
            await m.react('✖️');
            m.reply(`> *❌ Error:* Asegúrate de que tu versión de Baileys soporte \`groupStatusMessage\`.`);
        }
    }
}

export default groupStatusCommand;
