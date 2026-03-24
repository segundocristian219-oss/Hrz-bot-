import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            m.react('🕒');

            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);

            const memesList = res.memes || res.result || (Array.isArray(res) ? res : null);

            if (!memesList || !memesList.length) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes en este momento.`, m);
            }

            const rawMeme = memesList[Math.floor(Math.random() * memesList.length)];
            const memeUrl = typeof rawMeme === 'string' ? rawMeme : (rawMeme.url || rawMeme.image || rawMeme.link);

            if (!memeUrl) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ Error al extraer la URL del meme.`, m);
            }

            const messageContent = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                hasMediaAttachment: true,
                                imageMessage: (await conn.prepareMessageMedia({ image: { url: memeUrl } }, { upload: conn.waUploadToServer })).imageMessage
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
            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default memesCommand;
