import axios from 'axios';
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from '@whiskeysockets/baileys';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const url_api = global.url_api || 'https://api.dix.lat';

        try {
            await m.react('🕒');

            // 1. Obtener el meme
            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);
            const memesList = res.memes || res.result || (Array.isArray(res) ? res : null);
            const rawMeme = memesList[Math.floor(Math.random() * memesList.length)];
            let memeUrl = typeof rawMeme === 'string' ? rawMeme : (rawMeme.url || rawMeme.image || rawMeme.link);

            // 2. Preparar el media (Es vital para el header del interactiveMessage)
            const media = await prepareWAMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });

            // 3. Construir el mensaje con la estructura que me mandaste (Native Flow)
            const messageContent = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: `*── 「 MEMES 」 ──*\n\n> 😂 ¡Tu dosis de humor diario!` 
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ 
                                text: 'Voker Systems • Deylin' 
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({ 
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage 
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'Siguiente Meme 🔄',
                                            id: '.memes'
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            };

            // 4. Generar y enviar el paquete
            const msg = generateWAMessageFromContent(m.chat, messageContent, {
                userJid: conn.user.id,
                quoted: m
            });

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✅');

        } catch (error) {
            console.error('--- ERROR EN MEMES ---');
            console.error(error);
            await m.react('❌');
        }
    }
};

export default memesCommand;
