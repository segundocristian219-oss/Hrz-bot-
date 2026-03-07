import axios from 'axios';

const wallpaperCommand = {
    name: 'wallpaper',
    alias: ['wp', 'fondo'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            const query = text || 'minimalist';
            const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&categories=110&purity=100&sorting=random`;

            const { data: res } = await axios.get(url);

            if (!res?.data || res.data.length === 0) {
                m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron fondos para: *${query}*`, m);
            }

            const wp = res.data[Math.floor(Math.random() * res.data.length)];
            const imageBuffer = wp.path;

            await conn.sendMessage(m.chat, { 
                image: { url: imageBuffer }, 
                caption: `*── 「 WALLPAPER 」 ──*\n\n> 🔍 *Busqueda:* ${query}\n> 📐 *Resolución:* ${wp.resolution}\n\n*❯ Proveedor:* Wallhaven` 
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default wallpaperCommand;
