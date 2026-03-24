import axios from 'axios';
import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const url_api = global.url_api || 'https://api.dix.lat';

        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);
            const memesList = res.memes || res.result || (Array.isArray(res) ? res : null);
            const rawMeme = memesList[Math.floor(Math.random() * memesList.length)];
            let memeUrl = typeof rawMeme === 'string' ? rawMeme : (rawMeme.url || rawMeme.image || rawMeme.link);

            // Preparamos la imagen
            const media = await prepareWAMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });

            const template = generateWAMessageFromContent(m.chat, {
                templateMessage: {
                    hydratedTemplate: {
                        imageMessage: media.imageMessage,
                        hydratedContentText: "*── 「 MEMES 」 ──*\n\n> 😂 ¡Tu dosis de humor diario!",
                        hydratedFooterText: "Voker Systems • Deylin",
                        hydratedButtons: [
                            {
                                urlButton: {
                                    displayText: "Sitio Web 🌐",
                                    url: "https://dix.lat"
                                }
                            },
                            {
                                quickReplyButton: {
                                    displayText: "Siguiente Meme 🔄",
                                    id: ".memes"
                                }
                            }
                        ]
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, template.message, { messageId: template.key.id });
            await m.react('✅');

        } catch (error) {
            console.error('Error con Template Buttons:', error);
            // Si falla, enviamos el mensaje más básico posible (Imagen + Texto) para asegurar respuesta
            await conn.sendMessage(m.chat, { image: { url: memeUrl }, caption: '> 😂 ¡Siguiente meme!\nEscribe *.memes* para otro.' }, { quoted: m });
            await m.react('✅');
        }
    }
};

export default memesCommand;
