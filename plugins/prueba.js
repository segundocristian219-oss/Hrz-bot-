import axios from 'axios';
import { ffmpeg, extractMessageContent, generateWAMessageContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const addExif = async (webpBuffer, packname, author) => {
    try {
        const webpmux = await import('node-webpmux');
        const Image = webpmux.default?.Image || webpmux.Image;
        const img = new Image();
        await img.load(webpBuffer);
        const json = {
            'sticker-pack-id': crypto.randomBytes(8).toString('hex'),
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
        if (!text) return m.reply(`Uso: ${usedPrefix + command} <nombre o link>`);
        
        await m.react('⏳');
        let report = "";

        try {
            let detail;
            if (/sticker\.ly\/s\//i.test(text)) {
                const { data } = await axios.get(DOWNLOAD_URL, { params: { url: text, api_key: API_KEY } });
                detail = data.result;
            } else {
                const { data: sData } = await axios.get(SEARCH_URL, { params: { q: text, api_key: API_KEY } });
                if (!sData.status) throw new Error('No se encontraron resultados en la búsqueda.');
                const { data: dData } = await axios.get(DOWNLOAD_URL, { params: { url: sData.result[0].url, api_key: API_KEY } });
                detail = dData.result;
            }

            const stickers = (detail.stickers || []).slice(0, 5);
            const pack = detail.name || 'Pack';
            const auth = detail.author?.name || 'Voker';

            await m.reply(`📦 Intentando envío múltiple para: *${pack}*`);

            for (const [i, s] of stickers.entries()) {
                let success = false;
                let stickerErrors = [];

                try {
                    const res = await axios.get(s.imageUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const buffer = Buffer.from(res.data);

                    try {
                        let webp = await ffmpeg(buffer, ['-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba', '-q:v', '50'], 'png', 'webp');
                        const final = await addExif(webp, pack, auth);
                        await conn.sendMessage(m.chat, { sticker: final }, { quoted: m });
                        success = true;
                    } catch (e) {
                        stickerErrors.push(`Metodo 1 (FFMPEG): ${e.message}`);
                    }

                    if (!success) {
                        try {
                            await conn.sendMessage(m.chat, { sticker: { url: s.imageUrl } }, { quoted: m });
                            success = true;
                        } catch (e) {
                            stickerErrors.push(`Metodo 2 (URL Directa): ${e.message}`);
                        }
                    }

                    if (!success) {
                        try {
                            const { imageMessage } = await generateWAMessageContent({ image: buffer }, { upload: conn.waUploadToServer });
                            await conn.relayMessage(m.chat, { stickerMessage: { ...imageMessage, mimetype: 'image/webp' } }, { quoted: m });
                            success = true;
                        } catch (e) {
                            stickerErrors.push(`Metodo 3 (Relay): ${e.message}`);
                        }
                    }

                } catch (e) {
                    stickerErrors.push(`Descarga: ${e.message}`);
                }

                if (!success) {
                    report += `❌ Sticker ${i + 1}:\n${stickerErrors.join('\n')}\n\n`;
                } else {
                    await delay(1000);
                }
            }

            if (report) {
                await conn.sendMessage(m.chat, { text: `⚠️ *REPORTE DE FALLOS:*\n\n${report}` }, { quoted: m });
            }
            
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`*⚠️ ERROR CRÍTICO:* ${e.message}`);
        }
    }
};
