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

            if (!videoSearchResult) return conn.reply(m.chat, "No se hallaron resultados.", m);

            const videoId = videoSearchResult.videoId;
            const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
            const thumbUrl = videoSearchResult.image || videoSearchResult.thumbnail;

            const infoText = `\n\t\t\t\t*♬♫ YOUTUBE DOWNLOAD 𝄞*\n\n✰ *TÍTULO:* ${videoSearchResult.title}\n♛ *CANAL:* ${videoSearchResult.author?.name || '---'}\n✎ *TIEMPO:* ${videoSearchResult.timestamp || '---'}\n⌬ *VISTAS:* ${videoSearchResult.views?.toLocaleString() || '---'}\n▢ *LINK:* ${videoUrl}\n`;

            await conn.sendMessage(m.chat, { 
                image: { url: thumbUrl }, 
                caption: infoText,
                contextInfo: { ...global.channelInfo }
            }, { quoted: m });

            let downloadUrl;
            const apiKey = 'kirito-bot-oficial';

            try {
                const apiType = isAudio ? 'ytmp3' : 'ytmp4';
                const res = await fetch(`https://sylphyy.xyz/download/v2/${apiType}?url=${encodeURIComponent(videoUrl)}&api_key=${apiKey}`);
                const data = await res.json();
                if (data.status && data.result?.dl_url) {
                    downloadUrl = data.result.dl_url;
                }
            } catch (e) {
                console.error("API 1 Fallida, intentando Nexus...");
            }

            if (!downloadUrl) {
                try {
                    const nexusType = isAudio ? 'mp3' : 'mp4';
                    const res = await fetch(`https://panel.apinexus.fun/api/youtube/${nexusType}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                        body: JSON.stringify({ url: videoUrl })
                    });
                    const data = await res.json();
                    if (data.success) {
                        downloadUrl = isAudio ? data.data.audio : data.data.video;
                    }
                } catch (e) {
                    console.error("API Nexus Fallida");
                }
            }

            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga de ninguna API.");

            const mediaResponse = await fetch(downloadUrl);
            const mediaBuffer = await mediaResponse.buffer();

            if (isAudio) {
                await conn.sendMessage(m.chat, { 
                    audio: mediaBuffer, 
                    mimetype: "audio/mpeg",
                    fileName: `${videoSearchResult.title}.mp3`
                }, { quoted: m });
            } else {
                const instagramShortcode = "DXF25DKDZrN";
                const artResp = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
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
                        video: mediaBuffer,
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
                                        author: videoSearchResult.author?.name || 'Deylin Tech',
                                        title: videoSearchResult.title || 'KIRITO MUSIC',
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
