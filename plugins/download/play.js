/*import yts from 'yt-search';
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
                caption: infoText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    ...channelInfo
                }
            }, { quoted: m });

            let downloadUrl;
            if (isAudio) {

                const apiUrl = `https://api.dix.lat/mp3?url=${encodeURIComponent(videoUrl)}`;

/*&api_key=dx_lat_0x7B%5Cu200B%5Cu001B%5B38%3B5%3B214m%5Cu2060%5Cu200D%5Cu200B%5Cu200C_Voker_Sys_00%5Cu200B1.0.0_37080_159_0x%2502X%5Cu200B%5Cu200C%5Cu2060_%255B%2522%5Cu0024%5Cu007B0x00A0%5Cu007D%5Cu221E%5Cu2202%5Cu2206%2522%255D_%2520%5Cu200B%5Cu200D%5Cu2060_0x7F%5Cu0000%5Cu0001%5Cu0007%5Cu0008%5Cu000B%5Cu000C%5Cu000E%5Cu000F_S3R14L1Z3R_0x0D%5Cu200B%5Cu200D%5Cu2060_%255B%5Cu200B%5Cu200C%5Cu200B%5Cu200C%255D_0x2026_03_28_UTC_0x00*/
                const apiRes = await fetch(apiUrl).then(res => res.json());

                if (apiRes.status) {
                    downloadUrl = apiRes.data.dl;
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

export default youtubeCommand;*/



import yts from 'yt-search';
import fetch from 'node-fetch';
import axios from 'axios';
import crypto from 'crypto';

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

            if (!videoSearchResult) return conn.reply(m.chat, "No se hallaron resultados.", m);
            
            const videoId = videoSearchResult.videoId;
            const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
            const thumbUrl = videoSearchResult.image || videoSearchResult.thumbnail;

            
            const thumbResp = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
            const thumbBuffer = Buffer.from(thumbResp.data);
            const artworkSha256 = crypto.createHash('sha256').update(thumbBuffer).digest();

            
            let downloadUrl;
            const endpoint = isAudio ? 'mp3' : 'mp4';
            const apiRes = await fetch(`https://api.dix.lat/${endpoint}?url=${encodeURIComponent(videoUrl)}`).then(res => res.json());
            
            if (apiRes.status) downloadUrl = apiRes.data.dl;
            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga.");

            
            const mediaResponse = await fetch(downloadUrl);
            const mediaBuffer = await mediaResponse.buffer();

            if (isAudio) {
                
                await conn.sendMessage(m.chat, { 
                    audio: mediaBuffer, 
                    mimetype: "audio/mpeg",
                    fileName: `${videoSearchResult.title}.mp3`
                }, { quoted: m });
            } else {
                
                await conn.relayMessage(m.chat, {
                    videoMessage: {
                        url: (await conn.waUploadToServer(mediaBuffer, { mimetype: 'video/mp4' })).url,
                        directPath: (await conn.waUploadToServer(mediaBuffer, { mimetype: 'video/mp4' })).directPath,
                        mediaKey: (await conn.waUploadToServer(mediaBuffer, { mimetype: 'video/mp4' })).mediaKey,
                        mimetype: 'video/mp4',
                        caption: `*${videoSearchResult.title}*`,
                        jpegThumbnail: thumbBuffer,
                        fileLength: mediaBuffer.length,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363302772535780@newsletter',
                                newsletterName: 'Kirito ♕ — Official Channel ™',
                                serverMessageId: 1
                            }
                        },
                        annotations: [{
                            polygonVertices: [
                                { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 },
                                { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "DXF25DKDZrN",
                                    songId: "DXF25DKDZrN",
                                    author: videoSearchResult.author?.name || "Deylin Tech",
                                    title: videoSearchResult.title,
                                    artistAttribution: `https://www.instagram.com/p/DXF25DKDZrN/`,
                                    artworkSha256: artworkSha256,
                                    isExplicit: false,
                                    musicSongStartTimeInMs: 0
                                }
                            },
                            embeddedAction: true
                        }]
                    }
                }, { quoted: m });
            }

            await m.react("✅");
        } catch (error) {
            console.error(error);
            conn.reply(m.chat, `*Error:* ${error.message || error}`, m);
            await m.react("❌");
        }
    }
};

export default youtubeCommand;
