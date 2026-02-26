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
                return conn.reply(m.chat, `> ⍰ No hay memes disponibles.`, m);
            }

            const randomMeme = res.memes[Math.floor(Math.random() * res.memes.length)];

            const caption = `*── 「 VOKER MEME 」 ──*\n\n` +
                             `> 😂 ¡Humor instantáneo!\n\n` +
                             `*¿Quieres otro?* Reacciona con 🔄\n` +
                             `*──────────────────*`;

            const sentMsg = await conn.sendMessage(m.chat, { 
                image: { url: randomMeme }, 
                caption: caption 
            }, { quoted: m });

            // El bot deja la reacción puesta para "enseñar" al usuario
            await conn.sendMessage(m.chat, { react: { text: '🔄', key: sentMsg.key } });
            await m.react('✅');

        } catch (error) {
            console.error(`> [ERROR MEMES]:`, error);
            await m.react('❌');
        }
    }
};

export default memesCommand;
