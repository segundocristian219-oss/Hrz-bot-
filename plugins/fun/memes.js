import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=by_deylin`);

            if (!res.success || !res.memes || res.memes.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes en este momento.`, m);
            }

            const randomMeme = res.memes[Math.floor(Math.random() * res.memes.length)];

            const caption = `\t\t\t\t*── 「 MEME 」 ──*\n\n` +
                             `> 😂 ¡Humor instantáneo!\n\n` +
                             `*❯❯*`;

            await conn.sendMessage(m.chat, { 
                image: { url: randomMeme }, 
                caption: caption 
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR MEMES]: ${error.message}`);
            conn.reply(m.chat, '😿 Ocurrió un error al obtener el meme.', m);
        }
    }
};

export default memesCommand;
