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

            const caption = `*── 「 VOKER MEME 」 ──*\n\n` +
                             `> 😂 ¡Aquí tienes tu dosis de humor!\n\n` +
                             `*❯❯ VOKER PLATFORM*`;

            
            await conn.sendMessage(m.chat, { 
                image: { url: randomMeme }, 
                caption: caption 
            }, { quoted: m });

            
            await conn.sendMessage(m.chat, {
                poll: {
                    name: "¿Quieres ver otro meme?",
                    values: [`🔄 Enviar otro .${command}`, '✅ Ya fue suficiente'],
                    selectableCount: 1
                }
            });

            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR MEMES]: ${error.message}`);
            conn.reply(m.chat, '😿 No pude conseguir un meme, intenta de nuevo.', m);
        }
    }
};

export default memesCommand;
