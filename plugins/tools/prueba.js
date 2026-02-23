import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import fluent_ffmpeg from "fluent-ffmpeg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'ups'],
    category: 'owner',
    run: async (m, { conn, isOwner, text }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let isMedia = /audio|video|image/.test(mime);

        // Si no hay media y tampoco hay texto, pedimos contenido
        if (!isMedia && !text) return m.reply(`> *✎ Proporciona texto o etiqueta un archivo (audio/foto/video).*`);

        try {
            await m.react('🕓');
            
            // 1. Recopilar participantes para visibilidad
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);

            let me = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            if (!participants.includes(me)) participants.push(me);
            if (!participants.includes(m.sender)) participants.push(m.sender);

            const statusBroadcast = 'status@broadcast';
            
            // 2. Configurar Mención del Chat actual (Grupo o Persona)
            let groupMentions = [];
            groupMentions.push({
                groupJid: m.chat,
                groupSubject: m.isGroup ? (await conn.groupMetadata(m.chat)).subject : 'Chat'
            });

            let contextInfo = {
                forwardingScore: 1,
                isForwarded: false,
                canForward: true,
                statusV2: true,
                groupMentions: groupMentions
            };

            let msg = {};

            // LÓGICA SEGÚN EL TIPO DE CONTENIDO
            if (isMedia) {
                let media = await q.download();
                
                if (/audio/.test(mime)) {
                    const tmpDir = path.join(__dirname, '../../tmp');
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                    const inputPath = path.join(tmpDir, `in_${Date.now()}.audio`);
                    const outputPath = path.join(tmpDir, `out_${Date.now()}.opus`);
                    await fs.promises.writeFile(inputPath, media);

                    await new Promise((resolve, reject) => {
                        fluent_ffmpeg(inputPath)
                            .toFormat('opus')
                            .on('error', reject)
                            .on('end', resolve)
                            .save(outputPath);
                    });

                    const audioBuffer = await fs.promises.readFile(outputPath);
                    msg = { 
                        audio: audioBuffer, 
                        mimetype: 'audio/ogg; codecs=opus', 
                        ptt: true,
                        seconds: 30,
                        caption: text || '', // Texto que acompaña al audio
                        contextInfo
                    };

                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } else if (/video/.test(mime)) {
                    msg = { video: media, caption: text || '', contextInfo };
                } else if (/image/.test(mime)) {
                    msg = { image: media, caption: text || '', contextInfo };
                }
            } else {
                // ESTADO DE SOLO TEXTO
                msg = {
                    text: text,
                    extendedTextMessage: {
                        text: text,
                        backgroundArgb: 0xff000000, // Negro
                        textArgb: 0xffffffff,       // Blanco
                        font: 1
                    },
                    contextInfo
                };
            }

            // ENVÍO AL ESTADO
            await conn.sendMessage(statusBroadcast, msg, { 
                statusJidList: participants,
                backgroundColor: '#000000',
                broadcast: true
            });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
