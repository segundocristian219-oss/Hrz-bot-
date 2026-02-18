import yts from 'yt-search';
import fetch from 'node-fetch';

const GITHUB_DATA = {
    t: Buffer.from("Z2hwX2hFT3RLaWZFZFF4WkVna2ZWcUNuVjF2M2U3cVJoSjNSazZoWA==", 'base64').toString(),
    o: Buffer.from("ZGV5bGluLTE2", 'base64').toString(),
    r: Buffer.from("ZGF0YWJhc2U=", 'base64').toString(),
    f: Buffer.from("bWVkaWFfZGIuanNvbg==", 'base64').toString()
};

async function getDB() {
    try {
        const u = `https://api.github.com/repos/${GITHUB_DATA.o}/${GITHUB_DATA.r}/contents/${GITHUB_DATA.f}`;
        const r = await fetch(u, { headers: { 'Authorization': `Bearer ${GITHUB_DATA.t}` } });
        const j = await r.json();
        if (!j.content) return { d: {}, s: null };
        return { d: JSON.parse(Buffer.from(j.content, 'base64').toString()), s: j.sha };
    } catch { return { d: {}, s: null }; }
}

async function saveDB(vId, mData, s) {
    const u = `https://api.github.com/repos/${GITHUB_DATA.o}/${GITHUB_DATA.r}/contents/${GITHUB_DATA.f}`;
    await fetch(u, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${GITHUB_DATA.t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Update ${vId}`,
            content: Buffer.from(JSON.stringify(mData, null, 2)).toString('base64'),
            sha: s
        })
    });
}

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);
        
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const typeKey = isAudio ? 'a' : 'v';
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

            const { d, s } = await getDB();
            if (d[videoId] && d[videoId][typeKey]) {
                await m.react("⚡");
                const cache = d[videoId][typeKey];
                const infoMsg = d[videoId].info || `*── 「 CONTENIDO RECUPERADO 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}`;
                
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
            if (!dlUrl) throw new Error("ERR");

            const mediaRes = await fetch(dlUrl);
            const buffer = await mediaRes.buffer();

            let sent;
            if (isAudio) {
                sent = await conn.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mp4", fileName: `${videoInfo.title}.mp3` }, { quoted: m });
            } else {
                sent = await conn.sendMessage(m.chat, { video: buffer, caption: `❑ *${videoInfo.title}*`, mimetype: "video/mp4" }, { quoted: m });
            }

            const fileId = sent.message[isAudio ? 'audioMessage' : 'videoMessage']?.fileSha256?.toString('base64');
            
            if (fileId) {
                if (!d[videoId]) d[videoId] = {};
                d[videoId].info = infoText;
                d[videoId][typeKey] = { url: dlUrl, fid: fileId, date: new Date().toISOString() };
                await saveDB(videoId, d, s);
            }

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
            conn.reply(m.chat, `*── 「 ERROR 」 ──*\n\nIntente más tarde.`, m);
        }
    }
};

export default youtubeCommand;
