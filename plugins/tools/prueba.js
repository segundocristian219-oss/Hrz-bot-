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

        if (!isMedia && !text) return m.reply(`> *✎ Proporciona texto o etiqueta un archivo.*`);

        try {
            await m.react('🕓');
            
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);
            if (!participants.includes(m.sender)) participants.push(m.sender);

            const statusBroadcast = 'status@broadcast';
            
            // Contexto mejorado para habilitar funciones de estado
            let contextInfo = {
                forwardingScore: 1,
                isForwarded: false,
                canForward: true,
                statusV2: true,
                mentionedJid: participants, // Mencionamos a los contactos para mejorar alcance
                groupMentions: m.isGroup ? [{
                    groupJid: m.chat,
                    groupSubject: (await conn.groupMetadata(m.chat)).subject
                }] : []
            };

            let msg = {};
            if (isMedia) {
                let media = await q.download();
                
                if (/audio/.test(mime)) {
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const inputPath = path.join(tmpDir, `in_${Date.now()}.audio`);
                    const outputPath = path.join(tmpDir, `out_${Date.now()}.opus`);
                    await fs.promises.writeFile(inputPath, media);

                    await new Promise((resolve, reject) => {
                        fluent_ffmpeg(inputPath).toFormat('opus').on('error', reject).on('end', resolve).save(outputPath);
                    });

                    const audioBuffer = await fs.promises.readFile(outputPath);
                    msg = { 
                        audio: audioBuffer, 
                        mimetype: 'audio/ogg; codecs=opus', 
                        ptt: true,
                        seconds: 30,
                        contextInfo
                    };
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } else if (/video/.test(mime)) {
                    // SE AGREGA CAPTION DIRECTO AQUÍ PARA QUE NO FALLE
                    msg = { 
                        video: media, 
                        caption: text || '', 
                        mimetype: 'video/mp4',
                        contextInfo 
                    };
                } else if (/image/.test(mime)) {
                    msg = { 
                        image: media, 
                        caption: text || '', 
                        mimetype: 'image/jpeg',
                        contextInfo 
                    };
                }
            } else {
                msg = { text: text, contextInfo };
            }

            // 1. Enviar al estado general (Novedades) - Esto siempre funciona
            await conn.sendMessage(statusBroadcast, msg, { 
                statusJidList: participants,
                broadcast: true 
            });

            // 2. Intentar el "Estado de Grupo"
            // Para que no se vea como un reenvío simple, intentamos mandarlo con broadcast
            if (m.isGroup) {
                await conn.sendMessage(m.chat, msg, { 
                    backgroundColor: '#000000',
                    broadcast: true
                });
            }

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
