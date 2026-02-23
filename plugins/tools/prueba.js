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
            let thumbnail = null;
            let mediaUrl = '';
            let mediaType = 1;

            if (isMedia) {
                const ext = mime.split('/')[1].split(';')[0];
                const tempMedia = path.join(__dirname, `temp_${Date.now()}.${ext}`);
                await fs.promises.writeFile(tempMedia, media);

                const upload = await conn.waUploadToServer(media);
                mediaUrl = upload.url;

                const tempThumb = path.join(__dirname, `temp_${Date.now()}.jpg`);
                
                if (/image/.test(mime)) {
                    thumbnail = media;
                    mediaType = 1;
                } else if (/video/.test(mime)) {
                    await new Promise((resolve, reject) => {
                        fluent_ffmpeg(tempMedia)
                            .screenshots({
                                timestamps: ['50%'],
                                filename: path.basename(tempThumb),
                                folder: path.dirname(tempThumb),
                                size: '320x?'
                            })
                            .on('end', resolve)
                            .on('error', reject);
                    });
                    thumbnail = await fs.promises.readFile(tempThumb);
                    mediaType = 2;
                } else if (/audio/.test(mime)) {
                    await new Promise((resolve, reject) => {
                        fluent_ffmpeg(tempMedia)
                            .complexFilter('showwavespic=s=320x240:colors=#9cf')
                            .outputOptions('-frames:v 1')
                            .output(tempThumb)
                            .on('end', resolve)
                            .on('error', reject);
                    });
                    thumbnail = await fs.promises.readFile(tempThumb);
                    mediaType = 1;
                }

                if (fs.existsSync(tempMedia)) await fs.promises.unlink(tempMedia);
                if (fs.existsSync(tempThumb)) {
                    if (!thumbnail) thumbnail = await fs.promises.readFile(tempThumb);
                    await fs.promises.unlink(tempThumb);
                }
            }

            await conn.sendMessage(m.chat, {
                text: text || '',
                contextInfo: {
                    externalAdReply: {
                        title: 'ESTADO GRUPAL',
                        body: text ? text.slice(0, 100) : 'Toca para ver',
                        thumbnail: thumbnail,
                        mediaType: mediaType,
                        mediaUrl: mediaUrl,
                        sourceUrl: mediaUrl,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            });

            await m.react('✅');
        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply(`> *❌ Error al establecer el estado.*`);
        }
    }
}

export default groupStatusCommand;
