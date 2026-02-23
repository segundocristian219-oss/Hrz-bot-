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
        
        if (!/audio|video|image/.test(mime)) return m.reply(`> *✎ Etiqueta un archivo.*`);

        try {
            await m.react('🕓');
            let media = await q.download();
            
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);

            if (!participants.includes(m.sender)) participants.push(m.sender);

            const statusBroadcast = 'status@broadcast';
            
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
                
                await conn.sendMessage(statusBroadcast, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/ogg; codecs=opus', 
                    ptt: true,
                    seconds: 20 // Forzamos una duración para que WA lo reconozca
                }, { 
                    statusJidList: participants 
                });

                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            } else {
                let msg = {};
                if (/video/.test(mime)) {
                    msg = { video: media, caption: text || '' };
                } else if (/image/.test(mime)) {
                    msg = { image: media, caption: text || '' };
                }

                await conn.sendMessage(statusBroadcast, msg, { 
                    statusJidList: participants 
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
