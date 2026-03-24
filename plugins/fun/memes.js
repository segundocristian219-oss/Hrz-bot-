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

            if (!memesList || memesList.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes.`, m);
            }

            const rawMeme = memesList[Math.floor(Math.random() * memesList.length)];
            let memeUrl = typeof rawMeme === 'string' ? rawMeme : (rawMeme.url || rawMeme.image || rawMeme.link);

            if (!memeUrl || !memeUrl.startsWith('http')) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ URL de imagen inválida.`, m);
            }

            const media = await prepareWAMessageMedia(
                { image: { url: memeUrl } }, 
                { upload: conn.waUploadToServer }
            );

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage
                            },
                            body: {
                                text: `*── 「 MEMES 」 ──*\n\n> 😂 ¡Aquí tienes tu dosis de humor!`
                            },
                            footer: {
                                text: `Voker Systems • Deylin`
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "Siguiente Meme 🔄",
                                            id: ".memes"
                                        })
                                    }
                                ]
                            },
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 999,
                                isForwarded: true,
                                quotedMessage: m.message
                            }
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id 
            });

            await m.react('✅');

        } catch (error) {
            console.error('--- ERROR CRÍTICO EN MEMES ---');
            console.error(error);
            await m.react('❌');
        }
    }
};

export default memesCommand;
