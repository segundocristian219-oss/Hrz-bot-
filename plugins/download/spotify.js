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

            let txt = `\t\t\t\t*SPOTIFY DOWNLOAD*\n\n`;
            txt += `> ▢ *TÍTULO:* ${track.title}\n`;
            txt += `> ▢ *ARTISTA:* ${track.artist}\n`;
            txt += `> ▢ *ÁLBUM:* ${track.album}\n`;
            txt += `> ▢ *DURACIÓN:* ${track.duration}\n`;
            txt += `> ▢ *PUBLICADO:* ${track.publish}\n\n`;
            txt += `> _Procesando audio, espere un momento..._`;

         
await conn.sendMessage(m.chat, { 
    text: txt, 
    contextInfo: { 
        externalAdReply: {
            title: track.title,
            body: track.artist,
            mediaType: 2, 
            thumbnailUrl: track.image,
            mediaUrl: track.url,
            sourceUrl: track.url,
            showAdAttribution: true,
            renderLargerThumbnail: true 
        }
    }
}, { quoted: m });


            const downloadRes = await fetch(`https://api.delirius.store/download/spotifydl?url=${track.url}`);
            const textResponse = await downloadRes.text();
            
            let downloadData;
            try {
                downloadData = JSON.parse(textResponse);
            } catch (e) {
                return console.error("Error parseando JSON de descarga");
            }

            if (downloadData.status && downloadData.data.download) {
                await conn.sendMessage(m.chat, { 
                    audio: { url: downloadData.data.download }, 
                    mimetype: 'audio/mpeg', 
                    fileName: `${track.title}.mp3` 
                }, { quoted: m });
                await m.react('✅');
            } else {
                await m.react('✖️');
            }

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
    }
};

export default spotifyCommand;
