import fetch from 'node-fetch';

const spotifyCommand = {
    name: 'spotify',
    alias: ['s', 'sp', 'spotifydl'],
    category: 'download',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*S P O T I F Y  C O R E*\n\nUSO: ${usedPrefix + command} <query/url>`, m);

        await m.react("⌛");

        try {
            // FASE 1: BÚSQUEDA / EXTRACCIÓN DE METADATOS
            const searchApi = `https://api.delirius.store/search/spotify?q=${encodeURIComponent(text)}&limit=1`;
            const searchRes = await fetch(searchApi).then(res => res.json());

            if (!searchRes.status || !searchRes.data?.length) {
                await m.react("✖️");
                return conn.reply(m.chat, "ERROR: NO_RESULTS_FOUND", m);
            }

            const track = searchRes.data[0];
            const trackId = track.id;

            // FASE 2: OBTENCIÓN DE ENLACE DE DESCARGA
            // Usando el endpoint de descarga directa de Delirius
            const downloadApi = `https://api.delirius.store/download/spotify?url=https://open.spotify.com/track/${trackId}`;
            const dlRes = await fetch(downloadApi).then(res => res.json());

            if (!dlRes.status || !dlRes.data?.download) {
                throw new Error("DOWNLOAD_LINK_NOT_GENERATED");
            }

            const meta = dlRes.data;
            
            // FASE 3: CONSTRUCCIÓN DE INTERFAZ TÉCNICA
            const header = `KIRITO SYSTEM // SPOTIFY ENGINE\n\n` +
                           `TITLE: ${meta.title.toUpperCase()}\n` +
                           `ARTIST: ${meta.author.toUpperCase()}\n` +
                           `DURATION: ${track.duration}\n` +
                           `ID: ${trackId}\n` +
                           `STATUS: DEPLOYING_AUDIO_STREAM`;

            // ENVÍO DE METADATOS CON IMAGEN
            await conn.sendMessage(m.chat, { 
                image: { url: meta.image }, 
                caption: header 
            }, { quoted: m });

            // FASE 4: DESPLIEGUE DE ARCHIVO
            const audioBuffer = await fetch(meta.download).then(res => res.buffer());

            await conn.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${meta.title}.mp3`
            }, { quoted: m });

            await m.react("✅");

        } catch (error) {
            console.error(error);
            await m.react("✖️");
            conn.reply(m.chat, `FATAL_ERROR: ${error.message.toUpperCase()}`, m);
        }
    }
};

export default spotifyCommand;
