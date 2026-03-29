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
            const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;

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
                caption: infoText
            }, { quoted: m });

            let downloadUrl;
            if (isAudio) {
                const res = await fetch(`https://api.dix.lat/mp3?url=${encodeURIComponent(videoUrl)}`);
                const json = await res.json();
                if (json.status) {
                    downloadUrl = json.data.dl;
                }
            } else {
                const SYLPHY_API_KEY = process.env.KEY;
                const res = await fetch(`https://sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&api_key=${SYLPHY_API_KEY}`);
                const json = await res.json();
                if (json.status) {
                    downloadUrl = json.result.dl_url;
                }
            }

            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga.");

            const fileRes = await fetch(downloadUrl);
            if (!fileRes.ok) throw new Error(`Error al obtener archivo: ${fileRes.status}`);
            const buffer = await fileRes.buffer();

            await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: buffer, 
                mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
            }, { quoted: m });

            await m.react("✅");
        } catch (error) {
            conn.reply(m.chat, `*Error:* ${error.message || error}`, m);
            await m.react("❌");
        }
    }
};

export default youtubeCommand;
