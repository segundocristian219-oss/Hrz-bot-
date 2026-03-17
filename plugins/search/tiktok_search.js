import axios from 'axios';

const tiktokCommand = {
    name: 'tiktoksearch',
    alias: ['ttss', 'tsearch'],
    category: 'search',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return conn.reply(m.chat, `*── 「 TIKTOK SEARCH 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>`, m);

        await m.react("🕒");

        try {
            
            const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

            if (!response.data || !response.data.videos || response.data.videos.length === 0) {
                await m.react("❌");
                return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para su búsqueda.`, m);
            }

            
            const video = response.data.videos[0];
            const videoUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`;
            
            
            const downloadUrl = video.play || video.wmplay;

            
            const res = await axios.get(downloadUrl, { 
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const videoBuffer = Buffer.from(res.data);

            
            const caption = `*── 「 TIKTOK RESULT 」 ──*\n\n` +
                            `▢ *TÍTULO:* ${video.title || 'Sin descripción'}\n` +
                            `▢ *AUTOR:* ${video.author.nickname} (@${video.author.unique_id})\n` +
                            `▢ *DURACIÓN:* ${video.duration}s\n` +
                            `▢ *VISTAS:* ${video.play_count.toLocaleString()}\n` +
                            `▢ *LIKES:* ${video.digg_count.toLocaleString()}\n` +
                            `▢ *MÚSICA:* ${video.music_info.title} - ${video.music_info.author}\n\n` +
                            `▢ *LINK:* ${videoUrl}`;

            await conn.sendMessage(m.chat, { 
                video: videoBuffer, 
                caption: caption,
                mimetype: 'video/mp4',
                fileName: `tiktok.mp4`,
                contextInfo: {
                    externalAdReply: {
                        title: "TIKTOK SEARCH",
                        body: `By: ${video.author.nickname}`,
                        mediaType: 1, 
                        thumbnailUrl: video.origin_cover, 
                        renderLargerThumbnail: true,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: m });

            await m.react("✅");

        } catch (error) {
            console.error("Error en TikTokSearch:", error);
            await m.react("❌");
            
            conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*Detalle:* No se pudo obtener el archivo del video. Es posible que el servidor de origen esté saturado.`, m);
        }
    }
};

export default tiktokCommand;
