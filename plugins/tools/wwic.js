import axios from 'axios';
import * as cheerio from 'cheerio';

const conceptionCommand = {
    name: 'concepcion',
    alias: ['nacimiento', 'fecha', 'wwic'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`> *✎ Ingresa tu fecha de nacimiento (DD/MM/AAAA)*\n\n*Ejemplo:* ${usedPrefix + command} 01/01/2010`);

        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = text.match(dateRegex);
        if (!match) return m.reply(`> *⚠ Formato inválido. Usa: DD/MM/AAAA*`);

        let [_, day, month, year] = match;
        await m.react('⏳');

        try {
            const url = `https://www.whenwasiconceived.com/results?month=${month}&day=${day}&year=${year}`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });

            const $ = cheerio.load(data);

            const conceptionWeek = $('.calendars.fadein').text().replace(/\s+/g, ' ').trim();
            const songInfo = $('.box h1:contains("#1 Song")').nextAll('.info').first().text();
            const movieInfo = $('.box h1:contains("#1 Movie")').nextAll('.info').first().text();
            const moviePoster = $('.box h1:contains("#1 Movie")').nextAll('div').find('img').attr('src');
            const celebrities = $('.box h1:contains("You share a birthday with:")').parent().contents().filter(function() {
                return this.nodeType === 3;
            }).text().trim().replace(/\n/g, ', ');

            let caption = `✨ *RESULTADOS DE TU NACIMIENTO* ✨\n\n` +
                          `📅 *Nacimiento:* ${day}/${month}/${year}\n` +
                          `🐣 *Concepción:* ${conceptionWeek || 'N/A'}\n\n` +
                          `🎵 *Canción #1:* \n"${songInfo || 'N/A'}"\n\n` +
                          `🎬 *Película #1:* \n${movieInfo || 'N/A'}\n\n` +
                          `🎂 *Famosos:* \n${celebrities || 'N/A'}\n\n` +
                          `_Estimado basado en ciclo de 28 días._`;

            await m.react('📅');

            if (moviePoster) {
                await conn.sendMessage(m.chat, { 
                    image: { url: moviePoster }, 
                    caption 
                }, { quoted: m });
            } else {
                await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
            }

        } catch (err) {
            await m.react('🚫');
            console.error(err);
            m.reply(`*⚠️ ERROR AL CONSULTAR DATA*`);
        }
    }
};

export default conceptionCommand;
