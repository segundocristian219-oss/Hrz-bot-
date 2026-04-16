import axios from 'axios';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toWebp = (buffer) => new Promise((resolve, reject) => {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const input = path.join(tmpDir, `in_${crypto.randomBytes(4).toString('hex')}`);
    const output = path.join(tmpDir, `out_${crypto.randomBytes(4).toString('hex')}.webp`);
    
    fs.writeFileSync(input, buffer);

    const p = spawn('ffmpeg', [
        '-y', '-i', input,
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
        '-lossless', '1', '-q:v', '50', '-compression_level', '6',
        output
    ]);

    p.on('close', (code) => {
        if (code === 0 && fs.existsSync(output)) {
            const result = fs.readFileSync(output);
            try { fs.unlinkSync(input); fs.unlinkSync(output); } catch {}
            resolve(result);
        } else {
            try { fs.unlinkSync(input); } catch {}
            reject(new Error('ffmpeg_fail'));
        }
    });
});

const addExif = async (webpBuffer, packname, author) => {
    try {
        const webpmux = await import('node-webpmux');
        const Image = webpmux.default?.Image || webpmux.Image;
        const img = new Image();
        await img.load(webpBuffer);
        const json = {
            'sticker-pack-id': `voker-${crypto.randomBytes(4).toString('hex')}`,
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);
        const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8');
        img.exif = Buffer.concat([exifAttr, jsonBuf]);
        return await img.save(null);
    } catch { return webpBuffer; }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async function (m, { usedPrefix, command, text, conn }) {
        if (!text) return m.reply(`Uso: ${usedPrefix + command} <nombre o link>`);
        await m.react('⏳');

        try {
            let detail;
            if (/sticker\.ly\/s\//i.test(text)) {
                const { data } = await axios.get(DOWNLOAD_URL, { params: { url: text, api_key: API_KEY } });
                detail = data.result;
            } else {
                const { data: sData } = await axios.get(SEARCH_URL, { params: { q: text, api_key: API_KEY } });
                if (!sData || !sData.status) throw new Error('Sin resultados.');
                const { data: dData } = await axios.get(DOWNLOAD_URL, { params: { url: sData.result[0].url, api_key: API_KEY } });
                detail = dData.result;
            }

            const stickers = (detail.stickers || []).slice(0, 10);
            const packName = detail.name || 'Kirito Pack';
            const packAuthor = detail.author?.name || 'Voker Systems';

            await m.reply(`📦 Generando paquete: *${packName}*`);

            for (const s of stickers) {
                try {
                    const res = await axios.get(s.imageUrl, { responseType: 'arraybuffer' });
                    const webp = await toWebp(Buffer.from(res.data));
                    const final = await addExif(webp, packName, packAuthor);

                    await conn.sendMessage(m.chat, { 
                        sticker: final,
                        contextInfo: {
                            externalAdReply: {
                                title: packName,
                                body: packAuthor,
                                mediaType: 1,
                                thumbnail: final,
                                sourceUrl: 'https://dix.lat'
                            }
                        }
                    }, { quoted: m });
                    
                    await delay(1000);
                } catch (err) {
                    console.error('Error en sticker:', err.message);
                }
            }
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`⚠️ Error: ${e.message}`);
        }
    }
};
