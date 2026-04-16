import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import crypto from 'crypto';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
                    
                    const sticker = new Sticker(res.data, {
                        pack: packName,
                        author: packAuthor,
                        type: StickerTypes.FULL,
                        categories: ['🤩', '🎉'],
                        id: crypto.randomBytes(8).toString('hex'),
                        quality: 50
                    });

                    const buffer = await sticker.toBuffer();

                    await conn.sendMessage(m.chat, { 
                        sticker: buffer,
                        contextInfo: {
                            externalAdReply: {
                                title: packName,
                                body: packAuthor,
                                mediaType: 1,
                                thumbnail: buffer,
                                sourceUrl: 'https://dix.lat'
                            }
                        }
                    }, { quoted: m });
                    
                    await delay(1000);
                } catch (err) {
                    console.error('Error en sticker:', err.message);
                    m.reply(`❌ Fallo en un sticker: ${err.message}`);
                }
            }
            await m.react('✅');
        } catch (e) {
            await m.react('❌');
            m.reply(`⚠️ Error Crítico: ${e.message}`);
        }
    }
};
