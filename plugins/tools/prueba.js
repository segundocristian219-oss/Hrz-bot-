import axios from 'axios';

const wallpaperCommand = {
    name: 'wallpaper2',
    alias: ['wp2', 'hd3'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            const query = text || 'nature';
            const apiKey = '54924806-f3dbf063a8f732bda7f60d460'; 
            const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&per_page=20`;

            const { data: res } = await axios.get(url);

            if (!res?.hits || res.hits.length === 0) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ Sin resultados para: *${query}*`, m);
            }

            const image = res.hits[Math.floor(Math.random() * res.hits.length)];

            await conn.sendMessage(m.chat, { 
                image: { url: image.largeImageURL }, 
                caption: `*── 「 WALLPAPER HD 」 ──*\n\n> 👤 *Autor:* ${image.user}\n> 🏷️ *Tags:* ${image.tags}\n\n*❯ Proveedor:* Pixabay` 
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default wallpaperCommand;
