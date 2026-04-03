import axios from 'axios';
import * as cheerio from 'cheerio';

const newspaperCommand = {
    name: 'periodico',
    alias: ['noticia', 'fodey', 'prensa'],
    category: 'fun',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text.includes('|')) return m.reply(`> *✎ Crea tu propia noticia.*\n\n*Uso:* ${usedPrefix + command} Nombre del Diario | Titular | Tu noticia aqui`);

        let [name, title, content] = text.split('|').map(v => v.trim());
        if (!name || !title || !content) return m.reply(`*⚠️ Falta información. Usa el separador |*`);

        await m.react('🗞️');

        try {
            const baseUrl = 'https://www.fodey.com/generators/newspaper/snippet.asp';
            const params = new URLSearchParams({
                name: name,
                date: new Date().toLocaleDateString('es-HN'),
                headline: title,
                text: content
            });

            const { data } = await axios.get(`${baseUrl}?${params.toString()}`, {
                timeout: 15000
            });

            const $ = cheerio.load(data);
            const imageUrl = $('img').attr('src');

            if (!imageUrl) throw new Error('No image found');

            const fullImageUrl = `https://www.fodey.com${imageUrl}`;

            await m.react('📸');

            await conn.sendMessage(m.chat, { 
                image: { url: fullImageUrl }, 
                caption: `📰 *¡ÚLTIMA HORA!* 📰\n\n> _Noticia generada por: ${name}_` 
            }, { quoted: m });

        } catch (err) {
            await m.react('🚫');
            console.error(err);
            m.reply(`*⚠️ ERROR AL GENERAR LA NOTICIA*`);
        }
    }
};

export default newspaperCommand;
