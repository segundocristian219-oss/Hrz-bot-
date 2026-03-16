import fetch from 'node-fetch';

const spotifyCommand = {
    name: 'spotify',
    alias: ['spt', 'sp', 'music'],
    category: 'download',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`> ✎ USO: ${usedPrefix + command} <nombre de la canción>`);

        await m.react('🕓');

        try {
            const searchRes = await fetch(`https://api.delirius.store/search/spotify?q=${encodeURIComponent(text)}&limit=1`);
            const searchData = await searchRes.json();

            if (!searchData.status || !searchData.data.length) {
                await m.react('✖️');
                return m.reply('> ⚔ ERROR: No se encontraron resultados.');
            }

            const track = searchData.data[0];
            const downloadRes = await fetch(`https://api.delirius.store/download/spotify?url=${track.url}`);
            const downloadData = await downloadRes.json();

            if (!downloadData.status || !downloadData.data.download) {
                await m.react('✖️');
                return m.reply('> ⚔ ERROR: No se pudo generar el enlace de descarga.');
            }

            const { title, author, image } = downloadData.data;
            const downloadUrl = downloadData.data.download;

            let txt = `\t\t\t\t*SPOTIFY DOWNLOAD*\n\n`;
            txt += `> ▢ *TÍTULO:* ${title}\n`;
            txt += `> ▢ *ARTISTA:* ${author}\n`;
            txt += `> ▢ *ÁLBUM:* ${track.album || '---'}\n`;
            txt += `> ▢ *LANZAMIENTO:* ${track.publish || '---'}\n`;
            txt += `> ▢ *DURACIÓN:* ${track.duration}\n\n`;
            txt += `> _Enviando archivo de audio..._`;

            await conn.sendMessage(m.chat, { 
                image: { url: image }, 
                caption: txt 
            }, { quoted: m });

            await conn.sendMessage(m.chat, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg', 
                fileName: `${title}.mp3` 
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
    }
};

export default spotifyCommand;
