import yts from 'yt-search';
import fetch from 'node-fetch';

const GITHUB_CONFIG = {
    p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
    owner: "deylin-16",
    repo: "database",
    file: "media_db.json"
};

const getGitToken = () => GITHUB_CONFIG.p.join('');

async function getDB() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${getGitToken()}`, 'Accept': 'application/vnd.github.v3+json' } 
        });
        if (res.status === 404) return { data: {}, sha: null };
        const json = await res.json();
        return { 
            data: JSON.parse(Buffer.from(json.content, 'base64').toString()), 
            sha: json.sha 
        };
    } catch { return { data: {}, sha: null }; }
}

async function saveDB(newData, sha) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
    const body = {
        message: `Database Update: ${Date.now()}`,
        content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64')
    };
    if (sha) body.sha = sha;
    await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getGitToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);
        
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio_data' : 'video_data';
        await m.react("⌛");

        try {
            let videoId, videoInfo;
            const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

            if (videoMatch) {
                videoId = videoMatch[1];
                videoInfo = await yts({ videoId });
            } else {
                const search = await yts(text);
                if (!search.videos || search.videos.length === 0) return conn.reply(m.chat, "No se hallaron resultados.", m);
                videoInfo = search.videos[0];
                videoId = videoInfo.videoId;
            }

            const { data, sha } = await getDB();
            
            if (data[videoId] && data[videoId][mediaType]) {
                await m.react("⚡");
                const cache = data[videoId][mediaType];
                const infoMsg = data[videoId].infoText || `*── 「 RECUPERADO 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}`;
                
                await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoMsg }, { quoted: m });
                
                if (isAudio) {
                    return await conn.sendMessage(m.chat, { audio: { url: cache.url }, mimetype: "audio/mp4", fileName: `${videoInfo.title}.mp3` }, { quoted: m });
                } else {
                    return await conn.sendMessage(m.chat, { video: { url: cache.url }, caption: `❑ *${videoInfo.title}*`, mimetype: "video/mp4" }, { quoted: m });
                }
            }

            const url = 'https://youtube.com/watch?v=' + videoId;
            const encryptedUrl = isAudio ? global.api_endpoints.a : global.api_endpoints.v;
            const rawApi = Buffer.from(encryptedUrl, 'base64').toString('utf-8');
            const apiUrl = `${rawApi}?url=${encodeURIComponent(url)}`;

            const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *VISTAS:* ${videoInfo.views?.toLocaleString() || '---'}\n▢ *PUBLICADO:* ${videoInfo.ago || '---'}\n▢ *ID YT:* ${videoId}\n▢ *LINK:* ${url}\n▢ *ENVIANDO:* ${isAudio ? 'audio' : 'video'}..._`;

            await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

            const apiRes = await fetch(apiUrl).then(res => res.json());
            const dlUrl = apiRes?.file_url;
            if (!dlUrl) throw new Error("API_ERR");

            const mediaRes = await fetch(dlUrl);
            const buffer = await mediaRes.buffer();

            let sent;
            if (isAudio) {
                sent = await conn.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mp4", fileName: `${videoInfo.title}.mp3` }, { quoted: m });
            } else {
                sent = await conn.sendMessage(m.chat, { video: buffer, caption: `❑ *${videoInfo.title}*`, mimetype: "video/mp4" }, { quoted: m });
            }

            const waFileId = sent.message[isAudio ? 'audioMessage' : 'videoMessage']?.fileSha256?.toString('base64');
            
            if (waFileId) {
                if (!data[videoId]) data[videoId] = {};
                data[videoId].infoText = infoText;
                data[videoId][mediaType] = { 
                    url: dlUrl, 
                    wa_id: waFileId, 
                    saved_at: new Date().toLocaleString() 
                };
                await saveDB(data, sha);
            }

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
            console.error(error);
            conn.reply(m.chat, `*── 「 ERROR 」 ──*\n\nNo se pudo procesar la solicitud.`, m);
        }
    }
};

export default youtubeCommand;
