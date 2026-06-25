import axios from 'axios';

export const tiktokCommand = {
    category: 'search',
    commands: {
        tiktoksearch: {
            name: 'tiktoksearch',
            alias: ['ttss', 'tsearch'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) return conn.reply(m.chat, `*── 「 TIKTOK SEARCH 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>`, m);

                await m.react("🕒");

                try {
                    const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

                    if (!response.data || !response.data.videos || response.data.videos.length === 0) {
                        await m.react("❌");
                        return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para "${text}".`, m);
                    }

                    const video = response.data.videos[0];
                    const videoUrl = `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`;
                    const fmt = (num) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

                    const res = await axios.get(video.play, { 
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' },
                        timeout: 0 
                    });
                    const videoBuffer = Buffer.from(res.data);

                    const caption = `*── 「 TIKTOK RESULT 」 ──*\n\n` +
                                    `▢ *TÍTULO:* ${video.title || 'Sin descripción'}\n` +
                                    `▢ *AUTOR:* ${video.author?.nickname || 'Desconocido'}\n` +
                                    `▢ *DURACIÓN:* ${video.duration}s\n` +
                                    `▢ *PESO:* ${(video.size / (1024 * 1024)).toFixed(2)} MB\n` +
                                    `▢ *MÉTRICAS:* 👁️ ${fmt(video.play_count)} | ❤️ ${fmt(video.digg_count)}\n\n` +
                                    `▢ *LINK:* ${videoUrl}`;

                    await conn.sendMessage(m.chat, { 
                        video: videoBuffer, 
                        caption: caption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    await m.react("✅");

                } catch (error) {
                    await m.react("❌");
                    conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* Error al procesar o enviar el video completo.`, m);
                }
            }
        }
    }
};
