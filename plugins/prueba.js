import axios from 'axios';
import { spawn } from 'child_process';
import stream from 'stream';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    const res = await axios.get(url, { 
        responseType: 'arraybuffer', 
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return Buffer.from(res.data);
};

const toWebp = (buffer, isAnimated = false) => new Promise((resolve, reject) => {
    const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,format=yuva420p';
    const codec = isAnimated ? 'libwebp_anim' : 'libwebp';
    
    const args = [
        '-i', 'pipe:0', // Leer de stdin
        '-vf', vf,
        '-c:v', codec,
        '-q:v', '50',
        '-compression_level', '6',
        '-f', 'webp',   // Forzar formato de salida webp
        'pipe:1'        // Escribir a stdout
    ];

    if (isAnimated) args.push('-loop', '0', '-t', '8');

    const p = spawn('ffmpeg', args);
    let bufs = [];
    let errLog = '';

    p.stdout.on('data', (chunk) => bufs.push(chunk));
    p.stderr.on('data', (chunk) => errLog += chunk);

    p.on('close', (code) => {
        if (code === 0) {
            resolve(Buffer.concat(bufs));
        } else {
            reject(new Error(`FFMPEG error: ${errLog.slice(-100)}`));
        }
    });

    // Enviar el buffer al proceso ffmpeg
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(p.stdin);
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
                const { data } = await axios.get(DOWNLOAD_URL, { params: { url: text, api_key: API_KEY } });
                detail = data.result;
            } else {
                const { data: sData } = await axios.get(SEARCH_URL, { params: { q: text, api_key: API_KEY } });
                if (!sData.status) throw new Error('No hay resultados.');
                const { data: dData } = await axios.get(DOWNLOAD_URL, { params: { url: sData.result[0].url, api_key: API_KEY } });
                detail = dData.result;
            }

            const stickers = (detail.stickers || []).slice(0, 10);
            await m.reply(`📦 Enviando stickers de: *${detail.name}*`);

            for (const s of stickers) {
                try {
                    const buffer = await toBuffer(s.imageUrl);
                    const webp = await toWebp(buffer, s.isAnimated);
                    const final = await addExif(webp, detail.name, detail.author?.name || 'Bot');
                    await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                    await delay(1000);
                } catch (e) {
                    console.error('Error procesando sticker:', e.message);
                }
            }
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`*⚠️ ERROR:* ${e.message}`);
        }
    }
};
