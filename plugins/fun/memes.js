import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            
            m.react('🕒');

            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=voker`);

            if (!res?.success || !res.memes?.length) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ Sin memes disponibles.`, m);
            }

            const memeUrl = res.memes[Math.floor(Math.random() * res.memes.length)];

            await conn.sendMessage(m.chat, { 
                image: { url: memeUrl }, 
                caption: `\t\t\t\t*── 「 MEME 」 ──*\n\n> 😂 ¡Humor instantáneo!\n\n*❯❯*` 
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default memesCommand;
