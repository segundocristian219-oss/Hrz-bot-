import yts from 'yt-search';
import fetch from 'node-fetch';

const SYLPHY_API_KEY = process.env.KEY;

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
    caption: infoText,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: ch,
            newsletterName: name()
        }
    }
}, { quoted: m });


            let downloadUrl;
            if (isAudio) {
                const apiRes = await fetch(`https://sylphy.xyz/download/v2/ytmp3?url=${encodeURIComponent(videoUrl)}&mode=audio&q=128&api_key=${SYLPHY_API_KEY}`).then(res => res.json());
                if (apiRes.status) downloadUrl = apiRes.result.dl_url;
            } else {
                const apiRes = await fetch(`https://sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&api_key=${SYLPHY_API_KEY}`).then(res => res.json());
                if (apiRes.status) {
                    downloadUrl = apiRes.result.dl_url;
                } 
            }

            if (!downloadUrl) throw new Error("ERR_NO_URL");

            const response = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
            });
            if (!response.ok) throw new Error(`HTTP_ERR_${response.status}`);
            const buffer = await response.buffer();

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
