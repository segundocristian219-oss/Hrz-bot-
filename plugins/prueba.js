import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buffer = Buffer.from(res.data);
        if (buffer.length === 0) throw new Error('El buffer descargado está vacío.');
        return buffer;
    } catch (e) {
        throw new Error(`Error de red: ${e.message}`);
    }
};

const toWebp = (buffer, isAnimated = false) => new Promise((resolve, reject) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpDir = './tmp';
    const tmpIn = `${tmpDir}/k-in-${id}`;
    const tmpOut = `${tmpDir}/k-out-${id}.webp`;

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    fs.writeFileSync(tmpIn, buffer);

    if (fs.statSync(tmpIn).size === 0) {
        reject(new Error('El archivo temporal de entrada está vacío (0 bytes).'));
        return;
    }

    const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,format=yuva420p';
    const codec = isAnimated ? 'libwebp_anim' : 'libwebp';
    const args = ['-y', '-i', tmpIn, '-vf', vf, '-c:v', codec, '-q:v', '50', '-compression_level', '6'];
    if (isAnimated) args.push('-loop', '0', '-t', '8');
    args.push(tmpOut);

    const p = spawn('ffmpeg', args);
    let errLog = '';
    p.stderr.on('data', (data) => errLog += data);
    
    p.on('close', (code) => {
        try { if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
        if (code === 0 && fs.existsSync(tmpOut)) {
            const result = fs.readFileSync(tmpOut);
            try { fs.unlinkSync(tmpOut); } catch {}
            resolve(result);
        } else {
            reject(new Error(`FFMPEG fallo. Log: ${errLog.slice(-80)}`));
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

const searchPacks = async (query) => {
    const { data } = await axios.get(SEARCH_URL, { params: { q: query, api_key: API_KEY } });
    if (!data.status) throw new Error('Sin resultados en la búsqueda.');
    return data.result;
};

const getPackDetail = async (url) => {
    const { data } = await axios.get(DOWNLOAD_URL, { params: { url, api_key: API_KEY } });
    if (!data.status) throw new Error('No se pudo obtener el detalle del pack.');
    return data.result;
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async function (m, { usedPrefix, command, text, conn }) {
        try {
            if (!text) return m.reply(`Uso: ${usedPrefix + command} <nombre o link>`);
            await m.react('⏳');

            let detail;
            if (/sticker\.ly\/s\//i.test(text)) {
                detail = await getPackDetail(text);
            } else {
                const results = await searchPacks(text);
                detail = await getPackDetail(results[0].url);
            }

            const stickers = (detail.stickers || []).slice(0, 10);
            const packName = detail.name || 'Pack';
            const packAuthor = detail.author?.name || detail.author || 'Bot';

            await m.reply(`📦 Enviando stickers de: *${packName}*`);

            for (const s of stickers) {
                try {
                    const buffer = await toBuffer(s.imageUrl);
                    const webp = await toWebp(buffer, s.isAnimated);
                    const final = await addExif(webp, packName, packAuthor);
                    await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                    await delay(1200);
                } catch (e) {
                    console.error(e.message);
                }
            }
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`*⚠️ ERROR:* ${e.message}`);
        }
    }
};
