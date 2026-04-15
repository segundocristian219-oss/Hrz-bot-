import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';

const API_KEY = 'dx_lat_0x7B\u200B\u001B[38;5;214m\u2060\u200D\u200B\u200C_Voker_Sys_00\u200B1.0.0_37080_159_0x\u0025\u0058\u200B\u200C\u2060_\u005B\u0022\u0024\u007B0x00A0\u007D\u221E\u2202\u2206\u0022\u005D_\u0020\u200B\u200D\u2060_0x7F\u0000\u0001\u0007\u0008\u000B\u000C\u000E\u000F_S3R14L1Z3R_0x0D\u200B\u200D\u2060_\u005B\u200B\u200C\u200B\u200C\u005D_0x2026_03_28_UTC_0x00';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

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
    try {
        const webpmux = await import('node-webpmux');
        const Image = webpmux.default?.Image || webpmux.Image;
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
    } catch {
        return webpBuffer;
    }
};

const isValidWebP = (buf) =>
    buf.length > 12 &&
    buf.slice(0, 4).toString() === 'RIFF' &&
    buf.slice(8, 12).toString() === 'WEBP';

const searchPacks = async (query) => {
    try {
        const { data } = await axios.get(SEARCH_URL, {
            params: { q: query, api_key: API_KEY },
            timeout: 10000,
        });
        return data?.status ? data.result : [];
    } catch {
        return [];
    }
};

const getPackDetail = async (url) => {
    try {
        const { data } = await axios.get(DOWNLOAD_URL, {
            params: { url, api_key: API_KEY },
            timeout: 15000,
        });
        return data?.status ? data.result : null;
    } catch {
        return null;
    }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async function (m, { usedPrefix, command, text, conn }) {
        try {
            if (!text) {
                return m.reply(`ᰔᩚ *KIRITO STICKERS*\n\nUso: ${usedPrefix + command} <nombre o link>`);
            }

            await m.react('⏳');

            let packName, packAuthor, stickers;

            if (/sticker\.ly\/s\//i.test(text)) {
                const detail = await getPackDetail(text);
                if (!detail) throw new Error('Pack no encontrado o error en la API.');
                packName = detail.name || 'Pack';
                packAuthor = typeof detail.author === 'object' ? detail.author.name : (detail.author || 'Bot');
                stickers = (detail.stickers || []).slice(0, 10).map(s => ({
                    url: s.imageUrl,
                    animated: s.isAnimated,
                }));
            } else {
                const results = await searchPacks(text);
                if (!results.length) throw new Error('Sin resultados para: ' + text);

                const pack = results[0];
                const detail = await getPackDetail(pack.url);

                if (!detail) throw new Error('No se pudo obtener detalles del pack.');

                packName = detail.name || pack.name || 'Pack';
                packAuthor = typeof detail.author === 'object' ? detail.author.name : (detail.author || pack.author || 'Bot');
                
                stickers = (detail.stickers || []).slice(0, 10).map(s => ({
                    url: s.imageUrl,
                    animated: s.isAnimated,
                }));
            }

            if (!stickers || !stickers.length) throw new Error('No se encontraron stickers en este pack.');

            await m.reply(`📦 *${packName}*\n👤 ${packAuthor}\n🖼️ Enviando ${stickers.length} sticker(s)...`);

            let sent = 0;

            for (const [i, s] of stickers.entries()) {
                try {
                    const buffer = await toBuffer(s.url);
                    const webp = await toWebp(buffer, s.animated);
                    if (!isValidWebP(webp)) continue;
                    const final = await addExif(webp, packName, packAuthor);
                    await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                    sent++;
                    await delay(1500);
                } catch (err) {
                    console.warn(`[stickerpack] Error en sticker ${i + 1}:`, err.message);
                }
            }

            if (sent === 0) throw new Error('Ningún sticker pudo procesarse correctamente.');
            await m.react('✅');

        } catch (e) {
            console.error('[stickerpack]', e);
            await m.react('❌');
            m.reply(`*❌ Error:* ${e.message}`);
        }
    },
};
