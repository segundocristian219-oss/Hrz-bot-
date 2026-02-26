import axios from 'axios';
import pkg from '@whiskeysockets/baileys';
const { prepareWAMessageMedia, generateWAMessageFromContent } = pkg;

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=by_deylin`);

            if (!res.success || !res.memes || res.memes.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No hay memes disponibles.`, m);
            }

            const randomMeme = res.memes[Math.floor(Math.random() * res.memes.length)];

            // 1. Preparamos la media correctamente para el header
            const mediaMsg = await prepareWAMessageMedia({ image: { url: randomMeme } }, { upload: conn.waUploadToServer });

            // 2. Construimos el mensaje con la estructura exacta de la versión oficial
            const messageContent = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { text: `*── 「 VOKER MEME 」 ──*\n\n> 😂 ¡Humor automatizado!\n\n*❯❯ VOKER PLATFORM*` },
                            footer: { text: "Presiona el botón para más contenido" },
                            header: {
                                title: "MEME SYSTEM",
                                hasVideoMessage: false,
                                imageMessage: mediaMsg.imageMessage
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🔄 OTRO MEME",
                                            id: `${usedPrefix}${command}`
                                        })
                                    }
                                ],
                                messageParamsVersion: 1
                            }
                        }
                    }
                }
            };

            // 3. Generamos y enviamos usando la estructura de la librería oficial
            const msgs = await generateWAMessageFromContent(m.chat, messageContent, { 
                userJid: conn.user.id, 
                quoted: m 
            });

            await conn.relayMessage(m.chat, msgs.message, { messageId: msgs.key.id });
            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR TÉCNICO]:`, error);
        }
    }
};

export default memesCommand;
