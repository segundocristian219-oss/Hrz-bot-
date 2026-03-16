import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import fluent_ffmpeg from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "file-type";
import webp from "node-webpmux";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function addExif(webpSticker, packname, author, categories = ["🤩"], extra = {}) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: categories,
        ...extra,
    };
    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

function sticker6(img) {
    return new Promise(async (resolve, reject) => {
        try {
            const type = (await fileTypeFromBuffer(img)) || { mime: "image/jpeg", ext: "jpg" };
            const tmpDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

            const tmp = path.join(tmpDir, `${+new Date()}.${type.ext}`);
            const out = path.join(tmp + ".webp");

            await fs.promises.writeFile(tmp, img);

            const Fffmpeg = /video/i.test(type.mime)
                ? fluent_ffmpeg(tmp).inputFormat(type.ext)
                : fluent_ffmpeg(tmp).input(tmp);

            Fffmpeg.on("error", function (err) {
                if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                reject(err);
            })
            .on("end", async function () {
                if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                if (fs.existsSync(out)) {
                    const result = await fs.promises.readFile(out);
                    fs.unlinkSync(out);
                    resolve(result);
                }
            })
            .addOutputOptions([
                `-vcodec`, `libwebp`, `-vf`,
                `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
            ])
            .toFormat("webp")
            .save(out);
        } catch (e) {
            reject(e);
        }
    });
}

const stickerCommand = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'tools',
    run: async (m, { conn, args, text }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let txt = args.join(' ');

            if (!/image|video|webp/.test(mime)) return m.reply('> *✎ Responde a una imagen o video.*');

            if (/video/.test(mime)) {
                let duration = q.msg?.seconds || q.seconds || 0;
                if (duration > 7) {
                    await m.react('❌');
                    return m.reply('> *⍰ El video es demasiado largo.* La duración máxima para stickers es de *7 segundos*.');
                }
            }

            await m.react('🕓');

            let buffer = await q.download();
            if (!buffer) return m.reply('> ⚔ Error al descargar.');

            let stikerBuffer = await sticker6(buffer);
            
            let bot = typeof global.botNames === 'object' ? global.botNames[0];
            let user = m.pushName || 'User';
            
            let [pack, auth] = txt.includes('|') ? txt.split('|').map(v => v.trim()) : [bot, user];
            let exifSticker = await addExif(stikerBuffer, pack, auth);

            await conn.sendMessage(m.chat, { 
                sticker: exifSticker,
                contextInfo: {
                    forwardingScore: 1, 
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406846602793@newsletter',
                        serverMessageId: 100,
                        newsletterName: name()
                    }
                }
            }, { quoted: m });
            
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply('> ⚔ Error en el procesamiento interno.\n\nUsa el comando *#report* para reportar esté error.');
        }
    }
}

export default stickerCommand;
