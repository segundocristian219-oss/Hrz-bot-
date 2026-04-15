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

            if (isAudio) {
                const apiRes = await fetch(`https://sylphyy.xyz/download/v2/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=kirito-bot-oficial`).then(res => res.json());
                if (apiRes.status) {
                    downloadUrl = apiRes.result.dl_url;
                }
            } else {
                const apiRes = await fetch(`https://api.dix.lat/mp4?url=${encodeURIComponent(videoUrl)}`).then(res => res.json());
                if (apiRes.status) {
                    downloadUrl = apiRes.data.dl;
                }
            }

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
                const upload = await conn.waUploadToServer(mediaBuffer, { mimetype: 'video/mp4' });
                
                await conn.relayMessage(m.chat, {
                    videoMessage: {
                        url: upload.url,
                        directPath: upload.directPath,
                        mediaKey: upload.mediaKey,
                        mimetype: 'video/mp4',
                        caption: `*${videoSearchResult.title}*`,
                        jpegThumbnail: thumbBuffer,
                        fileLength: mediaBuffer.length,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: ch,
                                newsletterName: name(),
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
                                    author: videoSearchResult.author?.name || name(),
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
