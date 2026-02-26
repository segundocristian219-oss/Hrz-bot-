import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            
            await m.react('🕒');

            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=by_deylin`);

            if (!res || !res.success || !res.memes || res.memes.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se localizaron memes. Intenta más tarde.`, m);
            }

            const randomMeme = res.memes[Math.floor(Math.random() * res.memes.length)];

            const caption = `*── 「 VOKER MEME 」 ──*\n\n` +
                             `> 😂 ¡Humor instantáneo!\n\n` +
                             `*❯❯ VOKER PLATFORM*`;

            await conn.sendMessage(m.chat, { 
                image: { url: randomMeme }, 
                caption: caption 
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error(`> [ERROR CRÍTICO MEMES]: ${error.message}`);
            await m.react('❌');
            
            conn.reply(m.chat, `😿 Error en el sistema: ${error.message}`, m);
        }
    }
};

export default memesCommand;
