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

            const media = await prepareWAMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });

            const interactiveMessage = {
                body: { text: `*── 「 MEMES 」 ──*\n\n> 😂 ¡Aquí tienes tu dosis de humor!` },
                footer: { text: `Voker Systems • Deylin` },
                header: {
                    hasMediaAttachment: true,
                    imageMessage: media.imageMessage
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Siguiente Meme 🔄",
                            id: ".memes"
                        })
                    }]
                }
            };

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // CRÍTICO: Usamos directamente el contenido del mensaje generado
            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✅');

        } catch (error) {
            console.error('Error en memes:', error);
            // Si el mensaje interactivo falla, enviamos imagen normal como respaldo para que no te quedes en blanco
            await conn.sendMessage(m.chat, { image: { url: memeUrl }, caption: '> 😂 ¡Aquí tienes tu meme!' }, { quoted: m });
            await m.react('✅'); 
        }
    }
};

export default memesCommand;
