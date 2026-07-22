import yts from 'yt-search';
import sharp from 'sharp';
import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const downloadsModule = {
    category: 'download',
    commands: {
        youtube_play: {
            name: 'youtube_play',
            alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'playaudio', 'playvideo'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) return conn.reply(m.chat, `♕   *KIRITO DOWNLOAD* ➥\n\n*Uso:* ${usedPrefix + command} <búsqueda o enlace>`, m);

                const isAudio = /play$|audio$|mp3|ytmp3|playaudio/i.test(command);
                const isDocument = /mp3$|mp4$/i.test(command);
                const apiKey = key;

                await m.react('⌛');

                try {
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:microsoft\.com\/)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/;
                    const videoMatch = text.match(youtubeRegex);

                    let videoSearchResult = null;

                    if (videoMatch && videoMatch[1]) {
                        const cleanUrl = `https://www.youtube.com/watch?v=${videoMatch[1]}`;
                        const searchResults = await yts(cleanUrl);
                        videoSearchResult = searchResults?.videos?.[0];
                    } else {
                        const searchResults = await yts(text);
                        videoSearchResult = searchResults?.videos?.[0];
                    }

                    if (!videoSearchResult) return conn.reply(m.chat, 'No se hallaron resultados para la solicitud.', m);

                    const videoUrl = 'https://www.youtube.com/watch?v=' + videoSearchResult.videoId;
                    const thumbUrl = videoSearchResult.image || videoSearchResult.thumbnail;

                    const [thumbRes, apiRes] = await Promise.all([
                        fetch(thumbUrl).then(res => res.arrayBuffer()),
                        fetch(`https://panel.apinexus.fun/api/youtube/${isAudio ? 'mp3' : 'mp4'}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                            body: JSON.stringify({ url: videoUrl })
                        }).then(res => res.json())
                    ]);

                    const infoText = `
♫ YOUTUBE DOWNLOAD 𝄞

✰ TÍTULO: ${videoSearchResult.title.toUpperCase()}
♛ CANAL: ${videoSearchResult.author?.name || '---'}
✎ TIEMPO: ${videoSearchResult.timestamp || '---'}
⌬ VISTAS: ${videoSearchResult.views?.toLocaleString() || '---'}
◈ FECHA: ${videoSearchResult.ago || '---'}
⚑ URL CANAL: ${videoSearchResult.author?.url || '---'}

⌗ DESCRIPCIÓN: 
${videoSearchResult.description?.slice(0, 150) || 'Sin descripción'}...

⌕ ${videoUrl}
`;

                    conn.sendMessage(m.chat, {
                        image: { url: thumbUrl },
                        caption: infoText,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                    if (!apiRes?.success) throw new Error('API Fallida');

                    const downloadUrl = isAudio ? apiRes.data.audio : apiRes.data.video;

                    const headRes = await fetch(downloadUrl, { method: 'HEAD' });
                    const sizeInBytes = parseInt(headRes.headers.get('content-length') || '0');
                    if (sizeInBytes > 100 * 1024 * 1024) {
                        return conn.reply(m.chat, '⚠️ El archivo supera el límite establecido.', m);
                    }

                    const workerResponse = await dispatchMediaTask({
                        type: 'download_buffer',
                        url: downloadUrl
                    });

                    if (!workerResponse || !workerResponse.buffer) {
                        throw new Error('No se pudo procesar el buffer en el worker');
                    }

                    const fileExtension = isAudio ? 'mp3' : 'mp4';
                    const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';

                    if (isDocument) {
                        const processedThumbnail = await sharp(Buffer.from(thumbRes))
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();

                        await conn.sendMessage(m.chat, {
                            document: workerResponse.buffer,
                            mimetype: mimeType,
                            fileName: `${videoSearchResult.title}.${fileExtension}`,
                            caption: `*Título:* ${videoSearchResult.title}\n*Enlace:* ${videoUrl}`,
                            jpegThumbnail: processedThumbnail,
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    } else {
                        if (isAudio) {
                            await conn.sendMessage(m.chat, {
                                audio: workerResponse.buffer,
                                mimetype: 'audio/mpeg',
                                ptt: false,
                                contextInfo: { ...global.channelInfo }
                            }, { quoted: m });
                        } else {
                            await conn.sendMessage(m.chat, {
                                video: workerResponse.buffer,
                                mimetype: 'video/mp4',
                                caption: `*Título:* ${videoSearchResult.title}\n*Enlace:* ${videoUrl}`,
                                contextInfo: { ...global.channelInfo }
                              }, { quoted: m });
                        }
                    }

                    await m.react('✅');
                } catch (error) {
                    conn.reply(m.chat, `*Error:* ${error.message}`, m);
                    await m.react('❌');
                }
            }
        }
    }
};