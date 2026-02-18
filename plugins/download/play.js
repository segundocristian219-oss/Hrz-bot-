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
            
            const [videoSearchResult, dbResult] = await Promise.all([
                (async () => {
                    const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
                    if (videoMatch) return await yts({ videoId: videoMatch[1] });
                    const search = await yts(text);
                    return search.videos?.[0] || null;
                })(),
                getDB()
            ]);

            const videoInfo = videoSearchResult;
            if (!videoInfo) return conn.reply(m.chat, "No se hallaron resultados.", m);
            const videoId = videoInfo.videoId;
            const { data, sha } = dbResult;

            // CASO CACHÉ (INSTANTÁNEO)
            if (data[videoId]?.[mediaType]?.wa_id) {
                await m.react("⚡");
                const cache = data[videoId][mediaType];
                await conn.sendMessage(m.chat, { 
                    image: { url: videoInfo.image || videoInfo.thumbnail }, 
                    caption: data[videoId].infoText || `*── 「 RECUPERADO 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}` 
                }, { quoted: m });

                return await conn.sendMessage(m.chat, {
                    [isAudio ? 'audio' : 'video']: { url: videoInfo.url },
                    fileSha256: Buffer.from(cache.wa_id, 'base64'),
                    mimetype: isAudio ? "audio/mp4" : "video/mp4",
                    fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`
                }, { quoted: m });
            }

            
            const url = 'https://youtube.com/watch?v=' + videoId;
            const rawApi = Buffer.from(isAudio ? global.api_endpoints.a : global.api_endpoints.v, 'base64').toString('utf-8');
            const apiUrl = `${rawApi}?url=${encodeURIComponent(url)}`;

            const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *ID YT:* ${videoId}\n▢ *LINK:* ${url}\n\n_Enviando ${isAudio ? 'audio' : 'video'}..._`;

            
            await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

            
            const apiRes = await fetch(apiUrl).then(res => res.json());
            const dlUrl = apiRes?.file_url;
            if (!dlUrl) throw new Error("API_ERR");

            const sent = await conn.sendMessage(m.chat, { 
                [isAudio ? 'audio' : 'video']: { url: dlUrl }, 
                mimetype: isAudio ? "audio/mp4" : "video/mp4",
                fileName: `${videoInfo.title}.${isAudio ? 'mp3' : 'mp4'}`,
                caption: isAudio ? null : `❑ *${videoInfo.title}*`
            }, { quoted: m });

            (async () => {
                const waFileId = sent.message[isAudio ? 'audioMessage' : 'videoMessage']?.fileSha256?.toString('base64');
                if (waFileId) {
                    const freshDB = await getDB(); // Refrescamos por si hubo cambios
                    if (!freshDB.data[videoId]) freshDB.data[videoId] = {};
                    freshDB.data[videoId].infoText = infoText;
                    freshDB.data[videoId][mediaType] = { wa_id: waFileId, saved_at: new Date().toLocaleString() };
                    
                    const urlPut = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`;
                    await fetch(urlPut, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${getGitToken()}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: `DB Update: ${videoId}`,
                            content: Buffer.from(JSON.stringify(freshDB.data, null, 2)).toString('base64'),
                            sha: freshDB.sha
                        })
                    });
                }
            })().catch(e => console.error("Error guardando en DB:", e));

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
            console.error(error);
        }
    }
};

export default youtubeCommand;
