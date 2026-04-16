import axios from 'axios';
import { ffmpeg } from '@whiskeysockets/baileys'; // Usar el helper interno de Baileys

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const addExif = async (webpBuffer, packname = 'Bot', author = 'Deylin') => {
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
                if (!sData.status) throw new Error('Sin resultados.');
                const { data: dData } = await axios.get(DOWNLOAD_URL, { params: { url: sData.result[0].url, api_key: API_KEY } });
                detail = dData.result;
            }

            const stickers = (detail.stickers || []).slice(0, 10);
            await m.reply(`📦 Procesando pack: *${detail.name}*`);

            for (const s of stickers) {
                try {
                    // Descargamos el buffer
                    const res = await axios.get(s.imageUrl, { responseType: 'arraybuffer' });
                    let buffer = Buffer.from(res.data);

                    // Usamos la función interna de Baileys para convertir a WebP
                    // Esto es más estable porque Baileys ya tiene los argumentos de ffmpeg optimizados
                    let webp = await ffmpeg(
                        buffer,
                        ['-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba', '-q:v', '50'],
                        'png', // formato de entrada sugerido
                        'webp' // formato de salida
                    );

                    const finalSticker = await addExif(webp, detail.name, detail.author?.name || 'Voker');
                    
                    await conn.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
                    await delay(1500);
                } catch (err) {
                    console.error('Error en sticker individual:', err.message);
                    // Si falla el proceso manual, intentamos que WhatsApp lo gestione como imagen normal
                    // A veces esto fuerza a que el servidor de WA acepte el archivo
                }
            }
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`*⚠️ ERROR:* ${e.message}`);
        }
    }
};
