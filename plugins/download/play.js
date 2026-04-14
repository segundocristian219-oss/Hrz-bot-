import yts from 'yt-search';
import fetch from 'node-fetch';
import { generateWAMessageContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
import axios from 'axios';

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
                caption: infoText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: m });

            let downloadUrl;
            if (isAudio) {
                const apiKey = "dx_lat_0x7B\u200B\u001B[38;5;214m\u2060\u200D\u200B\u200C_Voker_Sys_00\u200B1.0.0_37080_159_0x%02X\u200B\u200C\u2060_%5B%22\u0024\u007B0x00A0\u007D\u221E\u2202\u2206%22%5D_%20\u200B\u200D\u2060_0x7F\u0000\u0001\u0007\u0008\u000B\u000C\u000E\u000F_S3R14L1Z3R_0x0D\u200B\u200D\u2060_%5B\u200B\u200C\u200B\u200C%5D_0x2026_03_28_UTC_0x00";
                const apiUrl = `https://sylphyy.xyz/download/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=${encodeURIComponent(apiKey)}`;
                
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

            if (isAudio) {
                await conn.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: "audio/mpeg",
                    fileName: `${videoInfo.title}.mp3`
                }, { quoted: m });
            } else {
                const albumArtUrl = videoInfo.image || videoInfo.thumbnail;
                const artResp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
                const albumArtBuffer = Buffer.from(artResp.data);

                const uploadedArt = await prepareWAMessageMedia(
                    { image: albumArtBuffer },
                    { upload: conn.waUploadToServer }
                );

                const messageContent = await generateWAMessageContent(
                    {
                        video: buffer,
                        mimetype: 'video/mp4',
                        jpegThumbnail: albumArtBuffer
                    },
                    { upload: conn.waUploadToServer }
                );

                await conn.relayMessage(m.chat, {
                    videoMessage: {
                        ...messageContent.videoMessage,
                        jpegThumbnail: albumArtBuffer.toString('base64'),
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363302772535780@newsletter',
                                newsletterName: 'Kirito ♕ — Official Channel ™',
                                serverMessageId: 999999
                            }
                        },
                        annotations: [
                            {
                                polygonVertices: [
                                    { x: 0.25, y: 0.41 },
                                    { x: 0.75, y: 0.41 },
                                    { x: 0.75, y: 0.58 },
                                    { x: 0.25, y: 0.58 }
                                ],
                                shouldSkipConfirmation: true,
                                embeddedContent: {
                                    embeddedMusic: {
                                        musicContentMediaId: "DXF25DKDZrN",
                                        author: videoInfo.author?.name || 'Deylin Tech',
                                        title: videoInfo.title || 'KIRITO MUSIC',
                                        artworkDirectPath: uploadedArt.imageMessage.directPath,
                                        artworkMediaKey:   uploadedArt.imageMessage.mediaKey,
                                        artworkSha256:     uploadedArt.imageMessage.fileSha256,
                                        artworkEncSha256:  uploadedArt.imageMessage.fileEncSha256
                                    }
                                },
                                embeddedAction: true
                            }
                        ]
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
