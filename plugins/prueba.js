import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';
import webpmux from 'node-webpmux';
const { Image } = webpmux;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
};

const toWebp = (buffer, isAnimated = false) => new Promise((resolve, reject) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpIn = `./tmp/k-in-${id}`;
    const tmpOut = `./tmp/k-out-${id}.webp`;
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
    fs.writeFileSync(tmpIn, buffer);
    const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,format=yuva420p';
    const codec = isAnimated ? 'libwebp_anim' : 'libwebp';
    const args = ['-y', '-i', tmpIn, '-vf', vf, '-c:v', codec, '-q:v', '50', '-compression_level', '6'];
    if (isAnimated) args.push('-loop', '0', '-t', '8');
    args.push(tmpOut);
    const p = spawn('ffmpeg', args);
    p.on('close', (code) => {
        try { fs.unlinkSync(tmpIn); } catch {}
        if (code === 0 && fs.existsSync(tmpOut)) {
            const result = fs.readFileSync(tmpOut);
            try { fs.unlinkSync(tmpOut); } catch {}
            resolve(result);
        } else {
            reject(new Error('ffmpeg error'));
        }
    });
});

const addExif = async (webpBuffer, packname = 'Bot', author = 'YukiWa') => {
    const img = new Image();
    await img.load(webpBuffer);
    const json = {
        'sticker-pack-id': `com.${author}.${packname}`.replace(/\s+/g, '').toLowerCase(),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);
    const jsonBuf = Buffer.from(JSON.stringify(json), 'utf-8');
    img.exif = Buffer.concat([exifAttr, jsonBuf]);
    return await img.save(null);
};

const isValidWebP = (buf) =>
    buf.length > 12 &&
    buf.slice(0, 4).toString() === 'RIFF' &&
    buf.slice(8, 12).toString() === 'WEBP';

const downloadPack = async (url) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/detail', {
            params: { url, key: 'YukiWaBot' },
            timeout: 10000,
        });
        return data;
    } catch {
        return { status: false };
    }
};

const searchPacks = async (query) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/search', {
            params: { query, key: 'YukiWaBot' },
            timeout: 10000,
        });
        return data;
    } catch {
        return { status: false };
    }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async (conn, m, opts) => {
        try {
            const usedPrefix = opts?.usedPrefix || '.';
            const command = opts?.command || 'spack';
            const text = opts?.text || m.text || '';

            if (!text) {
                return conn.reply(m.chat, `ᰔᩚ *KIRITO STICKERS*\n\nUso: ${usedPrefix + command} <nombre o link>`, m);
            }

            await m.react('⏳');

            let packData;

            if (/sticker\.ly\/s\//i.test(text)) {
                const detail = await downloadPack(text);
                if (!detail?.status) throw new Error('Pack no encontrado.');
                packData = detail.detalles;
            } else {
                const search = await searchPacks(text);
                if (!search?.status || !search.resultados?.length) throw new Error('Sin resultados para: ' + text);
                const res = await downloadPack(search.resultados[0].url);
                if (!res?.status) throw new Error('No se pudo obtener el pack.');
                packData = res.detalles;
            }

            const stickers = packData.stickers.slice(0, 10);
            const packName = packData.name || 'Pack';
            const packAuthor = packData.author || 'Bot';

            await conn.reply(m.chat, `📦 Enviando *${stickers.length}* stickers de *${packName}*...`, m);

            let sent = 0;

            for (const [i, s] of stickers.entries()) {
                try {
                    const buffer = await toBuffer(s.imageUrl);
                    const webp = await toWebp(buffer, s.isAnimated);
                    if (!isValidWebP(webp)) throw new Error('WebP inválido');
                    const final = await addExif(webp, packName, packAuthor);
                    await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                    sent++;
                    await delay(1200);
                } catch (err) {
                    console.warn(`[stickerpack] Sticker ${i + 1} falló:`, err.message);
                }
            }

            await m.react('✅');

            if (sent === 0) throw new Error('Ningún sticker pudo enviarse.');

        } catch (e) {
            console.error('[stickerpack]', e);
            await m.react('❌');
            conn.reply(m.chat, `*❌ Error:* ${e.message}`, m);
        }
    },
};
