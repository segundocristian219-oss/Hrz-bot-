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

            const infoText = `
\t\t\t\t*♬♫ YOUTUBE DOWNLOAD 𝄞*

✰ *TÍTULO:* ${videoInfo.title}
♛ *CANAL:* ${videoInfo.author?.name || '---'}
✎ *TIEMPO:* ${videoInfo.timestamp || '---'}
⌬ *VISTAS:* ${videoInfo.views?.toLocaleString() || '---'}
▢ *LINK:* https://youtube.com/watch?v=${videoId}
`;

            const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
            await conn.sendMessage(m.chat, { 
                image: { url: videoInfo.image || videoInfo.thumbnail }, 
                caption: infoText
            }, { quoted: m });

            let downloadUrl;
            if (isAudio) {

                const apiUrl = `https://sylphyy.xyz/download/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=dx_lat_0x7B\u200B\u001B[38;5;214m\u2060\u200D\u200B\u200C_Voker_Sys_00\u200B1.0.0_37080_159_0x%02X\u200B\u200C\u2060_%5B%22\u0024\u007B0x00A0\u007D\u221E\u2202\u2206%22%5D_%20\u200B\u200D\u2060_0x7F\u0000\u0001\u0007\u0008\u000B\u000C\u000E\u000F_S3R14L1Z3R_0x0D\u200B\u200D\u2060_%5B\u200B\u200C\u200B\u200C%5D_0x2026_03_28_UTC_0x00`;
                const apiRes = await fetch(apiUrl).then(res => res.json());

                if (apiRes.status && apiRes.result) {
                    downloadUrl = apiRes.result.dl_url;
                }
            } else {

                const apiRes = await fetch(`https://api.dix.lat/mp4?url=${encodeURIComponent(videoUrl)}`).then(res => res.json());
                if (apiRes.status) downloadUrl = apiRes.data.dl;
            }

            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga.");

            const response = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
            });

            if (!response.ok) throw new Error(`Error en la descarga: ${response.status}`);
            const buffer = await response.buffer();

            await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: buffer, 
                mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
            }, { quoted: m });

            await m.react("✅");
        } catch (error) {
            console.error(error);
            conn.reply(m.chat, `*Error:* ${error.message || error}`, m);
            await m.react("❌");
        }
    }
};


export default youtubeCommand;