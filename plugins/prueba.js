import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';

const API_KEY = 'kirito-bot-oficial'; 
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        return Buffer.from(res.data);
    } catch (e) {
        throw new Error(`Error al descargar buffer (URL: ${url.substring(0, 30)}...): ${e.message}`);
    }
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
    let errLog = '';
    p.stderr.on('data', (data) => errLog += data);
    p.on('close', (code) => {
        try { fs.unlinkSync(tmpIn); } catch {}
        if (code === 0 && fs.existsSync(tmpOut)) {
            const result = fs.readFileSync(tmpOut);
            try { fs.unlinkSync(tmpOut); } catch {}
            resolve(result);
        } else {
            reject(new Error(`FFMPEG fallo (Cod: ${code}). Log: ${errLog.slice(-100)}`));
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
    } catch (e) {
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
        if (!data.status) throw new Error(data.message || 'API de búsqueda respondió status: false');
        return data.result || [];
    } catch (e) {
        throw new Error(`Error en búsqueda: ${e.response?.data?.message || e.message}`);
    }
};

const getPackDetail = async (url) => {
    try {
        const { data } = await axios.get(DOWNLOAD_URL, {
            params: { url, api_key: API_KEY },
            timeout: 15000,
        });
        if (!data.status) throw new Error(data.message || 'API de descarga respondió status: false');
        return data.result;
    } catch (e) {
        throw new Error(`Error en detalles del pack: ${e.response?.data?.message || e.message}`);
    }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async function (m, { usedPrefix, command, text, conn }) {
        try {
            if (!text) return m.reply(`ᰔᩚ *KIRITO STICKERS*\n\nUso: ${usedPrefix + command} <nombre o link>`);

            await m.react('⏳');

            let packName, packAuthor, stickers;

            if (/sticker\.ly\/s\//i.test(text)) {
                const detail = await getPackDetail(text);
                packName = detail.name || 'Pack';
                packAuthor = typeof detail.author === 'object' ? detail.author.name : (detail.author || 'Bot');
                stickers = (detail.stickers || []).slice(0, 10);
            } else {
                const results = await searchPacks(text);
                if (!results.length) throw new Error('No se encontraron paquetes con ese nombre.');

                const detail = await getPackDetail(results[0].url);
                packName = detail.name || results[0].name || 'Pack';
                packAuthor = typeof detail.author === 'object' ? detail.author.name : (detail.author || results[0].author || 'Bot');
                stickers = (detail.stickers || []).slice(0, 10);
            }

            if (!stickers.length) throw new Error('El paquete está vacío o no tiene stickers procesables.');

            await m.reply(`📦 *${packName}*\n👤 ${packAuthor}\n🖼️ Intentando enviar ${stickers.length} sticker(s)...`);

            let sent = 0;
            let errors = [];

            for (const [i, s] of stickers.entries()) {
                try {
                    const buffer = await toBuffer(s.imageUrl);
                    const webp = await toWebp(buffer, s.isAnimated);
                    if (!isValidWebP(webp)) throw new Error('Buffer WebP inválido');
                    const final = await addExif(webp, packName, packAuthor);
                    await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                    sent++;
                    await delay(1000);
                } catch (err) {
                    errors.push(`Sticker ${i + 1}: ${err.message}`);
                }
            }

            if (sent === 0) {
                throw new Error(`Fallo total. Errores detectados:\n\n${errors.join('\n')}`);
            } else if (errors.length > 0) {
                await m.reply(`✅ Enviados: ${sent}\n❌ Fallidos: ${errors.length}\n\nDetalle del último error:\n${errors[errors.length - 1]}`);
            }

            await m.react('✅');

        } catch (e) {
            console.error('[stickerpack]', e);
            await m.react('❌');
            m.reply(`*⚠️ INFORME DE ERROR:*\n\n${e.message}`);
        }
    },
};
