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
            
            // 1. Participantes para el estado personal (eco)
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);
            if (!participants.includes(m.sender)) participants.push(m.sender);

            // 2. Configuración de Mención y Estado Grupal
            let contextInfo = {
                forwardingScore: 1,
                isForwarded: false,
                canForward: true,
                statusV2: true,
                // Si estamos en un grupo, activamos la mención especial
                groupMentions: m.isGroup ? [{
                    groupJid: m.chat,
                    groupSubject: (await conn.groupMetadata(m.chat)).subject
                }] : []
            };

            let msg = {};
            let options = { 
                statusJidList: participants,
                broadcast: true,
                backgroundColor: '#000000'
            };

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
                    // Eliminamos archivos temporales
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } else if (/video/.test(mime)) {
                    msg = { video: media, caption: text || '', contextInfo };
                } else if (/image/.test(mime)) {
                    msg = { image: media, caption: text || '', contextInfo };
                }
            } else {
                msg = { text: text, contextInfo };
            }

            // --- ENVÍO TRIPLE PARA ASEGURAR ---
            
            // A. Envío al Estado Personal (Novedades)
            await conn.sendMessage('status@broadcast', msg, options);

            // B. Envío al "Estado del Grupo" (Si es un grupo)
            // Esto intenta activar el anillo en la foto del grupo
            if (m.isGroup) {
                await conn.sendMessage(m.chat, msg, { 
                    backgroundColor: '#000000',
                    font: 1,
                    // Este flag es experimental en algunas versiones de Baileys para estados de grupo
                    asGroupStatus: true 
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
