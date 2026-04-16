import axios from 'axios';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import crypto from 'crypto';

const API_KEY = 'kirito-bot-oficial';
const SEARCH_URL = 'https://sylphyy.xyz/search/stickerly';
const DOWNLOAD_URL = 'https://sylphyy.xyz/download/stickerly';

export default {
    name: 'stickerpack',
    alias: ['spack'],
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
                if (!sData?.status) throw new Error('Sin resultados.');
                const { data: dData } = await axios.get(DOWNLOAD_URL, { params: { url: sData.result[0].url, api_key: API_KEY } });
                detail = dData.result;
            }

            const packName = detail.name || 'Kirito Pack';
            const packAuthor = detail.author?.name || 'Voker';
            const packId = crypto.randomUUID();
            const stickersData = (detail.stickers || []).slice(0, 10);
            
            const preparedStickers = [];
            for (const s of stickersData) {
                try {
                    const res = await axios.get(s.imageUrl, { responseType: 'arraybuffer' });
                    const sticker = new Sticker(res.data, {
                        pack: packName,
                        author: packAuthor,
                        type: StickerTypes.FULL,
                        id: packId,
                        quality: 50
                    });
                    const buffer = await sticker.toBuffer();
                    
                    // Preparamos el contenido multimedia para subirlo a los servidores de WA
                    const media = await conn.prepareWAMessageMedia({ sticker: buffer }, { upload: conn.waUploadToServer });
                    if (media.stickerMessage) {
                        preparedStickers.push(media.stickerMessage);
                    }
                } catch (e) {
                    console.error('Fallo al preparar sticker:', e.message);
                }
            }

            if (preparedStickers.length === 0) throw new Error('No se pudo preparar ningún sticker.');

            const msg = {
                stickerPackMessage: {
                    stickerPackId: packId,
                    name: packName,
                    publisher: packAuthor,
                    stickers: preparedStickers,
                    trayIconFileName: "tray_" + packId + ".png",
                    thumbnailSha256: preparedStickers[0].fileSha256,
                    stickerPackOrigin: 1
                }
            };

            // Intentamos enviar usando la estructura de mensaje compatible con Baileys
            await conn.relayMessage(m.chat, msg, { messageId: conn.generateMessageTag() });
            
            await m.react('✅');

        } catch (e) {
            await m.react('❌');
            m.reply(`⚠️ Error: ${e.message}`);
        }
    }
};
