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
                const input = path.join(tmpDir, `${Date.now()}.mp3`);
                const output = path.join(tmpDir, `${Date.now()}.mp4`);
                
                await fs.promises.writeFile(input, media);

                await new Promise((resolve, reject) => {
                    fluent_ffmpeg(input)
                        .outputOptions([
                            '-c:a aac',
                            '-b:a 128k',
                            '-vn'
                        ])
                        .toFormat('mp4')
                        .on('error', reject)
                        .on('end', resolve)
                        .save(output);
                });

                const audioBuffer = await fs.promises.readFile(output);
                
                await conn.sendMessage(statusBroadcast, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mp4', 
                    ptt: true,
                    seconds: 30
                }, { 
                    statusJidList: participants 
                });

                if (fs.existsSync(input)) fs.unlinkSync(input);
                if (fs.existsSync(output)) fs.unlinkSync(output);

            } else {
                let msg = {};
                let contentText = text || ""; 

                if (/video/.test(mime)) {
                    msg = { video: media, caption: contentText };
                } else if (/image/.test(mime)) {
                    msg = { image: media, caption: contentText };
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
