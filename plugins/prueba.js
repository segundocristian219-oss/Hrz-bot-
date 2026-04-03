import axios from 'axios';
import * as cheerio from 'cheerio';

const movieClipsCommand = {
    name: 'clip',
    alias: ['movieclip', 'escena', 'yarn'],
    category: 'search',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`> *✎ Ingresa una palabra o frase para buscar el clip.*\n\n*Ejemplo:* ${usedPrefix + command} I'll be back`);

        await m.react('🔍');

        try {
            const searchUrl = `https://getyarn.io/yarn-find?text=${encodeURIComponent(text)}`;
            const { data } = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });

            const $ = cheerio.load(data);
            const clipPath = $('.clip-card .clip-link').first().attr('href');

            if (!clipPath) {
                await m.react('🚫');
                return m.reply(`*⚠️ No se encontraron clips para:* "${text}"`);
            }

            const idClip = clipPath.split('/').pop();
            const videoUrl = `https://y.yarn.co/${idClip}.mp4`;
            const title = $('.clip-card .title').first().text().trim() || 'Película desconocida';
            const dialogue = $('.clip-card .transcript').first().text().trim() || text;

            await m.react('🎬');

            let caption = `🎬 *CLIP DE PELÍCULA* 🎬\n\n` +
                          `🎥 *Origen:* ${title}\n` +
                          `💬 *Diálogo:* "${dialogue}"\n\n` +
                          `> _Cargado desde Yarn Engine_`;

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: m });

        } catch (err) {
            await m.react('🚫');
            console.error(err);
            m.reply(`*⚠️ ERROR AL BUSCAR EL CLIP*`);
        }
    }
};

export default movieClipsCommand;
