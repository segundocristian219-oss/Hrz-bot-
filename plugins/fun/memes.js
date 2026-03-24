import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const url_api = global.url_api || 'https://api.dix.lat'; // Aseguramos que exista la base

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

            let media;
            try {
                media = await conn.prepareMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer });
            } catch (e) {
                console.error('Error preparando media:', e.message);
                // Si falla prepareMedia, intentamos enviar como mensaje de texto con imagen normal
                return conn.sendMessage(m.chat, { image: { url: memeUrl }, caption: '> 😂 ¡Aquí tienes tu meme!' }, { quoted: m });
            }

            const messageContent = {
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
                            }
                        }
                    }
                }
            };

            await conn.relayMessage(m.chat, messageContent, { messageId: conn.generateMessageTag(), quoted: m });
            await m.react('✅');

        } catch (error) {
            // Esto hará que el error aparezca sí o sí en tu consola
            console.log('--- ERROR EN COMANDO MEMES ---');
            console.error(error);
            console.log('-------------------------------');
            await m.react('❌');
        }
    }
};

export default memesCommand;
