import yts from 'yt-search';
import fetch from 'node-fetch';

const GITHUB_CONFIG = {
    p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
    owner: "deylin-16",
    repo: "database",
    file: "media_db.json"
};

const getGitToken = () => GITHUB_CONFIG.p.join('');

let localDB = null;
let lastUpdate = 0;

async function syncDB() {
    if (localDB && (Date.now() - lastUpdate < 300000)) return localDB;
    try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${getGitToken()}`, 'Accept': 'application/vnd.github.v3+json' } 
        });
        const json = await res.json();
        localDB = { 
            data: JSON.parse(Buffer.from(json.content, 'base64').toString()), 
            sha: json.sha 
        };
        lastUpdate = Date.now();
        return localDB;
    } catch { return { data: {}, sha: null }; }
}

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio_data' : 'video_data';
        await m.react("⌛");

        try {
            const [videoSearchResult, dbResult] = await Promise.all([
                (async () => {
                    const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
                    if (videoMatch) return await yts({ videoId: videoMatch[1] });
                    const search = await yts(text);
                    return search.videos?.[0] || null;
                })(),
                syncDB()
            ]);

            const videoInfo = videoSearchResult;
            if (!videoInfo) return conn.reply(m.chat, "No se hallaron resultados.", m);
            const videoId = videoInfo.videoId;
            const { data, sha } = dbResult;

            let useCache = false;
            let cacheData = null;

            if (data[videoId]?.[mediaType]) {
                cacheData = data[videoId][mediaType];
                const savedAt = new Date(cacheData.saved_at).getTime();
                if (Date.now() - savedAt < 86400000) {
                    useCache = true;
                }
            }

            const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *VISTAS:* ${videoInfo.views?.toLocaleString() || '---'}\n▢ *PUBLICADO:* ${videoInfo.ago || '---'}\n▢ *ID YT:* ${videoId}\n▢ *LINK:* https://youtube.com/watch?v=${videoId}\n▢ *ENVIANDO:* ${isAudio ? 'audio' : 'video'}..._`;

            if (useCache && cacheData) {
                await m.react("⚡");
                await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

                return await conn.sendMessage(m.chat, {
                    [isAudio ? 'audio' : 'video'] : { url: cacheData.raw.url },
                    mimetype: isAudio ? "audio/mp4" : "video/mp4",
                    fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`,
                    ...cacheData.raw,
                    fileSha256: Buffer.from(cacheData.raw.fileSha256, 'base64'),
                    fileEncSha256: Buffer.from(cacheData.raw.fileEncSha256, 'base64'),
                    mediaKey: Buffer.from(cacheData.raw.mediaKey, 'base64')
                }, { quoted: m });
            }

            const url = 'https://youtube.com/watch?v=' + videoId;
            const rawApi = Buffer.from(isAudio ? global.api_endpoints.a : global.api_endpoints.v, 'base64').toString('utf-8');
            const apiUrl = `${rawApi}?url=${encodeURIComponent(url)}`;

            await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

            const apiRes = await fetch(apiUrl).then(res => res.json());
            if (!apiRes?.file_url) throw new Error("ERR");

            const sent = await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: { url: apiRes.file_url }, 
                mimetype: isAudio ? "audio/mp4" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
            }, { quoted: m });

            (async () => {
                const msg = sent.message[isAudio ? 'audioMessage' : 'videoMessage'];
                if (msg) {
                    const rawJson = {
                        url: msg.url,
                        fileSha256: msg.fileSha256.toString('base64'),
                        fileEncSha256: msg.fileEncSha256.toString('base64'),
                        mediaKey: msg.mediaKey.toString('base64'),
                        fileLength: msg.fileLength,
                        directPath: msg.directPath,
                        mediaKeyTimestamp: msg.mediaKeyTimestamp
                    };

                    if (!data[videoId]) data[videoId] = {};
                    data[videoId][mediaType] = { 
                        raw: rawJson, 
                        saved_at: new Date().toISOString() 
                    };

                    await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${getGitToken()}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: `SpeedCache: ${videoId}`,
                            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                            sha: sha
                        })
                    });
                    localDB.data = data;
                }
            })().catch(() => null);

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
        }
    }
};

export default youtubeCommand;
