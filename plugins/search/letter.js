import fetch from 'node-fetch';

const lyricsCommand = {
    name: 'letra',
    alias: ['lyrics', 'lrc'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`> ✎ USO: ${usedPrefix + command} <nombre de la canción / artista>`);

        await m.react('🔍');

        const formatLyrics = (title, artist, lyrics) => {
            return `*🎵 LETRA ENCONTRADA*\n\n` +
                   `> ▢ *TÍTULO:* ${title}\n` +
                   `> ▢ *ARTISTA:* ${artist}\n\n` +
                   `${lyrics}`;
        };

        try {
            try {
                const res1 = await fetch(`https://api.delirius.store/search/lyrics?q=${encodeURIComponent(text)}`);
                const data1 = await res1.json();
                
                if (data1.status && data1.data) {
                    const { title, artist, lyrics } = data1.data;
                    await m.react('✅');
                    return m.reply(formatLyrics(title, artist, lyrics));
                }
            } catch (err) {}

            try {
                const res2 = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(text)}`);
                const data2 = await res2.json();

                if (data2.length > 0) {
                    const track = data2[0];
                    const lyricsBody = track.plainLyrics || track.syncedLyrics || "Letra no disponible en formato texto.";
                    await m.react('✅');
                    return m.reply(formatLyrics(track.trackName, track.artistName, lyricsBody));
                }
            } catch (err) {}

            try {
                let artist = "Desconocido";
                let song = text;
                if (text.includes('-')) {
                    [artist, song] = text.split('-').map(str => str.trim());
                }

                const res3 = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
                const data3 = await res3.json();

                if (data3.lyrics) {
                    await m.react('✅');
                    return m.reply(formatLyrics(song.toUpperCase(), artist.toUpperCase(), data3.lyrics));
                }
            } catch (err) {}

            await m.react('✖️');
            m.reply('> ⚔ ERROR: No se pudo encontrar la letra en ninguna de las fuentes disponibles.');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
    }
};

export default lyricsCommand;
