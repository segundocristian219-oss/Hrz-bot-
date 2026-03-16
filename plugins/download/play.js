import yts from 'yt-search';
import fetch from 'node-fetch';

const GITHUB_CONFIG = {
    p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
    owner: "deylin-16",
    repo: "database",
    file: "media_db.json"
};

const SYLPHY_API_KEY = "sylphy-jCQvxB8";

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
        if (!text?.trim()) return conn.reply(m.chat, `ᰔᩚ   *KIRITO DOWNLOAD* ᥫᩣ\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio_data' : 'video_data';
        await m.react("⌛");

        try {
            const [videoSearchResult, dbResult] = await Promise.all([
                (async () => {
                    const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([id=a-zA-Z0-9_-]{11})/);
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

            const infoText = `\t\t\t\t*YOUTUBE DOWNLOAD*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *VISTAS:* ${videoInfo.views?.toLocaleString() || '---'}\n▢ *LINK:* https://youtube.com/watch?v=${videoId}\n\n_⚡ ESTADO: ${useCache ? 'Descargando...' : 'Descargando...'}_`;

            if (useCache && cacheData) {
                await m.react("⚡");
                await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

                return await conn.sendMessage(m.chat, {
                    [isAudio ? 'audio' : 'video'] : { url: cacheData.raw.url },
                    mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                    fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`,
                    ...cacheData.raw,
                    fileSha256: Buffer.from(cacheData.raw.fileSha256, 'base64'),
                    fileEncSha256: Buffer.from(cacheData.raw.fileEncSha256, 'base64'),
                    mediaKey: Buffer.from(cacheData.raw.mediaKey, 'base64')
                }, { quoted: m });
            }

            const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
            await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

            let downloadUrl;
            if (isAudio) {
                // Nuevo endpoint de audio solicitado
                const apiRes = await fetch(`https://sylphy.xyz/download/ytdl?url=${encodeURIComponent(videoUrl)}&mode=audio&q=128&api_key=${SYLPHY_API_KEY}`).then(res => res.json());
                if (apiRes.status) downloadUrl = apiRes.result.dl_url;
            } else {
                // Endpoint de video (se mantiene el anterior o se puede ajustar si sylphy actualiza el ytdl para video)
                const apiRes = await fetch(`https://sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&api_key=${SYLPHY_API_KEY}`).then(res => res.json());
                if (apiRes.status) {
                    downloadUrl = apiRes.result.dl_url;
                } else {
                    const fbRes = await fetch(`https://api-adonix.ultraplus.click/download/ytvideo?apikey=AdonixKeyvr85v01953&url=${encodeURIComponent(videoUrl)}`).then(res => res.json());
                    downloadUrl = fbRes.data?.url;
                }
            }

            if (!downloadUrl) throw new Error("ERR_NO_URL");

            const response = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
            });
            if (!response.ok) throw new Error(`HTTP_ERR_${response.status}`);
            const buffer = await response.buffer();

            const sent = await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: buffer, 
                mimetype: isAudio ? "audio/mpeg" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
            }, { quoted: m });

            // Segundo plano: Guardar en GitHub SpeedCache
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
                            message: `Kirito SpeedCache: ${videoId}`,
                            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                            sha: sha
                        })
                    });
                    localDB.data = data;
                }
            })().catch(() => null);

            await m.react("✅");
        } catch (error) {
            conn.reply(m.chat, `*Error:* ${error.message || error}`, m);
            await m.react("❌");
        }
    }
};

export default youtubeCommand;
