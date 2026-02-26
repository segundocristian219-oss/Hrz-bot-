import axios from 'axios';

const tiktokCommand = {
    name: 'tiktok',
    alias: ['tt', 'tk', 'tiktokdl'],
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
            
            const res = await axios.get(video.play, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(res.data);

            const caption = `*── 「 TIKTOK RESULT 」 ──*\n\n` +
                            `▢ *TÍTULO:* ${video.title || 'Sin descripción'}\n` +
                            `▢ *AUTOR:* ${video.author.nickname}\n` +
                            `▢ *LINK:* ${videoUrl}\n\n` +
                            `*❯❯ VOKER PLATFORM - AUTOMATION*`;

            await conn.sendMessage(m.chat, { 
                video: videoBuffer, 
                caption: caption,
                mimetype: 'video/mp4',
                contextInfo: {
                    externalAdReply: {
                        title: "TIKTOK DOWNLOADER",
                        body: video.author.nickname,
                        mediaType: 2,
                        thumbnailUrl: video.origin_cover, 
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: m });

            await m.react("✅");

        } catch (error) {
            console.error(error);
            await m.react("❌");
            conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* Error al procesar el video.`, m);
        }
    }
};

export default tiktokCommand;
