import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            m.react('🕒');

            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);

            if (!res || !res.status || !res.result || !res.result.length) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes en este momento.`, m);
            }

            const memeUrl = res.result[Math.floor(Math.random() * res.result.length)];

            
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
                                text: `Presiona el botón para ver más.`
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
            conn.reply(m.chat, `> ⚠️ Ocurrió un error al obtener el meme.`, m);
        }
    }
};

export default memesCommand;
