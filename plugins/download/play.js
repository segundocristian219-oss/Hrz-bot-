
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
                const apiRes = await fetch(apiUrl).then(res => res.json());
                if (apiRes.status) downloadUrl = apiRes.data.dl;
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
                const instagramShortcode = "DXF25DKDZrN";

                const artResp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
                const albumArtBuffer = Buffer.from(artResp.data);

                const uploadedArt = await prepareWAMessageMedia(
                    { image: albumArtBuffer },
                    { upload: conn.waUploadToServer }
                );

                const artDirectPath = uploadedArt.imageMessage.directPath;
                const artMediaKey   = uploadedArt.imageMessage.mediaKey;
                const artSha256     = uploadedArt.imageMessage.fileSha256;
                const artEncSha256  = uploadedArt.imageMessage.fileEncSha256;

                const messageContent = await generateWAMessageContent(
                    {
                        video: buffer,
                        mimetype: 'video/mp4',
                        jpegThumbnail: albumArtBuffer
                    },
                    { upload: conn.waUploadToServer }
                );

                const videoMsg = messageContent.videoMessage;

                await conn.relayMessage(m.chat, {
                    videoMessage: {
                        ...videoMsg,
                        jpegThumbnail: albumArtBuffer.toString('base64'),
                        thumbnailWidth: 480,
                        thumbnailHeight: 480,
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
                                    { x: 0.25, y: 0.41553908586502075 },
                                    { x: 0.75, y: 0.41553908586502075 },
                                    { x: 0.75, y: 0.5844531059265137  },
                                    { x: 0.25, y: 0.5844531059265137  }
                                ],
                                shouldSkipConfirmation: true,
                                embeddedContent: {
                                    embeddedMusic: {
                                        musicContentMediaId: instagramShortcode,
                                        songId: instagramShortcode,
                                        author: videoInfo.author?.name || 'Deylin Tech',
                                        title: videoInfo.title || 'KIRITO MUSIC',
                                        artistAttribution: `https://www.instagram.com/p/${instagramShortcode}/`,
                                        artworkDirectPath: artDirectPath,
                                        artworkMediaKey:   artMediaKey,
                                        artworkSha256:     artSha256,
                                        artworkEncSha256:  artEncSha256,
                                        isExplicit: false,
                                        musicSongStartTimeInMs: 0,
                                        derivedContentStartTimeInMs: 0,
                                        overlapDurationInMs: 30000
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
