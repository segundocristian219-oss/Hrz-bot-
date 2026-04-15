import yts from 'yt-search';
import fetch from 'node-fetch';

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `ᰔᩚ   *KIRITO DOWNLOAD* ᥫᩣ\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        await m.react("⌛");

        try {
            
            const videoSearchResult = await (async () => {
                const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([id=a-zA-Z0-9_-]{11})/);
                if (videoMatch) return await yts({ videoId: videoMatch[1] });
                const search = await yts(text);
                return search.videos?.[0] || null;
            })();

            const videoInfo = videoSearchResult;
            if (!videoInfo) return conn.reply(m.chat, "No se hallaron resultados.", m);
            const videoId = videoInfo.videoId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const infoText = `
\t\t\t\t*♬♫ YOUTUBE DOWNLOAD 𝄞*

✰ *TÍTULO:* ${videoInfo.title}
♛ *CANAL:* ${videoInfo.author?.name || '---'}
✎ *TIEMPO:* ${videoInfo.timestamp || '---'}
⌬ *VISTAS:* ${videoInfo.views?.toLocaleString() || '---'}
▢ *LINK:* ${videoUrl}
`;

            
            await conn.sendMessage(m.chat, { 
                image: { url: videoInfo.image || videoInfo.thumbnail }, 
                caption: infoText,
                contextInfo: {
                    ...channelInfo
               }
            }, { quoted: m });

            let downloadUrl;

            if (isAudio) {
                
                const apiRes = await fetch('https://panel.apinexus.fun/api/youtube/mp3', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'x-api-key': key
                    },
                    body: JSON.stringify({ url: videoUrl })
                }).then(r => r.json());

                if (apiRes.success && apiRes.data?.audio) {
                    downloadUrl = apiRes.data.audio;
                } else {
                    throw new Error("La API de Nexus no devolvió un enlace de audio.");
                }

            } else {
                
                const apiRes = await fetch(`https://api.dix.lat/mp4?url=${encodeURIComponent(videoUrl)}`).then(res => res.json());
                if (apiRes.status) {
                    downloadUrl = apiRes.data.dl;
                }
            }

            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga.");

            
            const response = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
            });

            if (!response.ok) throw new Error(`Error en el servidor de descarga: ${response.status}`);
            const buffer = await response.buffer();

            
            await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: buffer, 
                mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
            }, { quoted: m });

            await m.react("✅");

        } catch (error) {
            console.error(error);
            conn.reply(m.chat, `*Error:* ${error.message || 'Ocurrió un fallo inesperado'}`, m);
            await m.react("❌");
        }
    }
};

export default youtubeCommand;
