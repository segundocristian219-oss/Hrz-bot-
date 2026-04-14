import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';
import webpmux from 'node-webpmux';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
};

const toWebp = (buffer, isAnimated = false) => new Promise((resolve, reject) => {
    const tmpIn = `./tmp/k-in-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpOut = `./tmp/k-out-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    fs.writeFileSync(tmpIn, buffer);
    
    const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,format=yuva420p';
    const codec = isAnimated ? 'libwebp_anim' : 'libwebp';
    const args = ['-y', '-i', tmpIn, '-vf', vf, '-c:v', codec, '-q:v', '50', '-compression_level', '6'];
    if (isAnimated) args.push('-loop', '0');
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

const searchPacks = async (query, attempt = 1) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/search', { 
            params: { query, key: 'YukiWaBot' }, 
            timeout: 10000 
        });
        return data;
    } catch (e) {
        if (e.response?.status === 429 && attempt <= 3) { 
            await delay((e.response.headers['retry-after'] || 5) * 1000); 
            return searchPacks(query, attempt + 1); 
        }
        throw e;
    }
};

const downloadPack = async (url, attempt = 1) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/detail', { 
            params: { url, key: 'YukiWaBot' }, 
            timeout: 10000 
        });
        return data;
    } catch (e) {
        if (e.response?.status === 429 && attempt <= 3) { 
            await delay((e.response.headers['retry-after'] || 5) * 1000); 
            return downloadPack(url, attempt + 1); 
        }
        return { status: false, error: e.response?.status || 500 };
    }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers', 'sly'],
    category: 'stickers',
    run: async (conn, m, { text, usedPrefix, command }) => {
        try {
            if (!text) return conn.reply(m.chat, `ᰔᩚ   *KIRITO STICKERS* ᥫᩣ\n\n*Uso:* ${usedPrefix + command} <búsqueda o link>`, m);
            
            await m.react('⏳');
            
            let packData;
            const isUrl = /sticker\.ly\/s\//i.test(text);

            if (isUrl) {
                const detail = await downloadPack(text);
                if (!detail?.status || !detail.detalles) throw new Error("Link no válido o pack privado.");
                packData = detail.detalles;
            } else {
                const search = await searchPacks(text);
                if (!search.status || !search.resultados?.length) throw new Error("No se hallaron resultados.");
                
                // Selección aleatoria de uno de los mejores resultados
                const topPacks = search.resultados.slice(0, 5);
                const randomPack = topPacks[Math.floor(Math.random() * topPacks.length)];
                
                const detail = await downloadPack(randomPack.url);
                if (!detail?.status) throw new Error("Error al obtener detalles del pack.");
                packData = detail.detalles;
            }

            const { name: packName, author, stickers, thumbnailUrl } = packData;
            const selectedStickers = stickers.slice(0, 30); // Límite de 30 para evitar saturación de RAM

            // Procesamiento en paralelo
            const [cover, stickerResults] = await Promise.all([
                (async () => {
                    try {
                        const buf = await toBuffer(thumbnailUrl);
                        const converted = await toWebp(buf, false);
                        const img = new webpmux.Image();
                        await img.load(converted);
                        return await img.save(null);
                    } catch { return Buffer.alloc(0); }
                })(),
                Promise.all(selectedStickers.map(async (s) => {
                    try {
                        const buffer = await toBuffer(s.imageUrl);
                        const sticker = await toWebp(buffer, s.isAnimated || false);
                        const img = new webpmux.Image();
                        await img.load(sticker);
                        return { 
                            sticker: await img.save(null), 
                            isAnimated: s.isAnimated || false, 
                            emojis: ['🎭'] 
                        };
                    } catch { return null; }
                })).then(res => res.filter(r => r !== null))
            ]);

            if (!stickerResults.length) throw new Error("No se procesaron stickers.");

            // Envío del paquete oficial
            await conn.sendMessage(m.chat, { 
                stickerPack: { 
                    name: packName || 'Kirito Pack', 
                    publisher: author?.name || 'Voker Systems', 
                    description: 'Kɪʀɪᴛᴏ-Bᴏᴛ Sʏsᴛᴇᴍ', 
                    cover, 
                    stickers: stickerResults 
                } 
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            conn.reply(m.chat, `*Error:* ${e.message}`, m);
        }
    }
};
