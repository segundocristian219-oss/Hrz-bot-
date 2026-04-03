import axios from 'axios';

const animeVisualsCommand = {
    name: 'anime',
    alias: ['waifu', 'neko', 'shinobu'],
    category: 'fun',
    nsfw: true,
    run: async (m, { conn, text, usedPrefix, command }) => {
        const categories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'];
        
        let type = text.toLowerCase().trim();
        if (!categories.includes(type)) {
            return m.reply(`> *✎ Selecciona una categoría válida.*\n\n*Categorías disponibles:* \n${categories.join(', ')}\n\n*Ejemplo:* ${usedPrefix + command} waifu`);
        }

        await m.react('⏳');

        try {
            const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`, {
                timeout: 10000
            });

            if (!data.url) throw new Error('No image found');

            await m.react('✨');

            let caption = `✨ *ANIME VISUAL* ✨\n\n` +
                          `🎞️ *Categoría:* ${type.toUpperCase()}\n` +
                          `🔗 *URL:* ${data.url}\n\n` +
                          `> _Cargado desde Waifu.pics Engine_`;

            await conn.sendMessage(m.chat, { 
                image: { url: data.url }, 
                caption 
            }, { quoted: m });

        } catch (err) {
            await m.react('🚫');
            console.error(err);
            m.reply(`*⚠️ ERROR AL OBTENER EL CONTENIDO*`);
        }
    }
};

export default animeVisualsCommand;
