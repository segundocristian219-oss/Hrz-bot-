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

            const media = await prepareWAMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });

            // Esta estructura es la que mejor aceptan las CUENTAS NORMALES
            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage
                            },
                            body: { text: "*── 「 MEMES 」 ──*\n\n> 😂 ¡Ríete un poco!" },
                            footer: { text: "Voker Systems • Deylin" },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        // "quick_reply" es el más compatible con cuentas personales
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "Siguiente Meme 🔄",
                                            id: ".memes"
                                        })
                                    }
                                ]
                            },
                            contextInfo: {
                                // Forzamos metadatos de visualización para saltar bloqueos
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2,
                                externalAdReply: {
                                    title: 'Voker Systems',
                                    body: 'Comando de Humor',
                                    thumbnailUrl: memeUrl,
                                    sourceUrl: 'https://dix.lat',
                                    mediaType: 1,
                                    renderLargerThumbnail: false
                                }
                            }
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✅');

        } catch (error) {
            console.error('Error en memes:', error);
            // Backup: Si falla el interactivo, enviamos normal para no dejar al usuario esperando
            await conn.sendMessage(m.chat, { image: { url: memeUrl }, caption: '> 😂 ¡Siguiente meme!' }, { quoted: m });
            await m.react('✅');
        }
    }
};

export default memesCommand;
