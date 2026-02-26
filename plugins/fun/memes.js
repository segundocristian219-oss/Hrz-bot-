import axios from 'axios';

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

            // CONSTRUCCIÓN DEL MENSAJE INTERACTIVO (EL CAMINO DIFÍCIL)
            const interactiveMessage = {
                body: { text: `*── 「 VOKER MEME 」 ──*\n\n> 😂 ¡Humor automatizado!\n\n*❯❯ VOKER PLATFORM*` },
                footer: { text: "Presiona el botón para más contenido" },
                header: {
                    hasVideoMessage: false,
                    imageMessage: (await conn.prepareWAMessageMedia({ image: { url: randomMeme } }, { upload: conn.waUploadToServer })).imageMessage,
                    title: "MEME SYSTEM",
                    itemType: 0
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🔄 OTRO MEME",
                                id: `${usedPrefix}${command}` // Envía el comando de nuevo al presionar
                            })
                        }
                    ],
                    messageParamsVersion: 1
                }
            };

            const msg = await conn.generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR MEMES BUTTON]: ${error.message}`);
        }
    }
};

export default memesCommand;
