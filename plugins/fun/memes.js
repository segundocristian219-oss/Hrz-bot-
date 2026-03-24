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

            // 1. Petición a la API
            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);
            
            // Validación de respuesta basada en tu código
            if (!res?.éxito || !res.memes?.length) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes en este momento.`, m);
            }

            const memeUrl = res.memes[Math.floor(Math.random() * res.memes.length)];

            // 2. Preparar la imagen para el encabezado interactivo
            const media = await prepareWAMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });

            // 3. Estructura Native Flow (La más compatible y moderna)
            const messageContent = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: `*── 「 MEMES 」 ──*\n\n> 😂 ¡Aquí tienes tu dosis de humor!` 
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
                                    },
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'Canal Oficial 📢',
                                            url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m'
                                        })
                                    }
                                ]
                            }),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363305113111051@newsletter',
                                    newsletterName: 'Voker Updates',
                                    serverMessageId: -1
                                }
                            }
                        })
                    }
                }
            };

            // 4. Generación y envío mediante relayMessage para evitar filtros
            const msg = generateWAMessageFromContent(m.chat, messageContent, {
                userJid: conn.user.id,
                quoted: m
            });

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✅');

        } catch (error) {
            console.error(`> [ERROR EN MEMES]: ${error.message}`);
            await m.react('❌');
            // Fallback en caso de error crítico: envía mensaje simple
            if (typeof memeUrl !== 'undefined') {
                await conn.sendMessage(m.chat, { image: { url: memeUrl }, caption: '> 😂 ¡Siguiente meme!\nEscribe *.memes* para otro.' }, { quoted: m });
            }
        }
    }
};

export default memesCommand;
