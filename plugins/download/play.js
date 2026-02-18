import yts from 'yt-search';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hoqepnhitygxsejlukux.supabase.co', 'sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M');

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

        await m.react("⌛");

        try {
            let videoId, videoInfo;
            const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

            if (videoMatch) {
                videoId = videoMatch[1];
                videoInfo = await yts({ videoId });
            } else {
                const search = await yts(text);
                if (!search.videos || search.videos.length === 0) return conn.reply(m.chat, "No se hallaron resultados.", m);
                videoInfo = search.videos[0];
                videoId = videoInfo.videoId;
            }

            const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
            const url = 'https://youtube.com/watch?v=' + videoId;
            
            const encryptedUrl = isAudio ? global.api_endpoints.a : global.api_endpoints.v;
            const rawApi = Buffer.from(encryptedUrl, 'base64').toString('utf-8');
            const apiUrl = `${rawApi}?url=${encodeURIComponent(url)}`;
            
            const apiRes = await fetch(apiUrl).then(res => res.json());
            const dlUrl = apiRes?.file_url;
            if (!dlUrl) throw new Error("ENC_SERVER_ERROR");
            
            const mediaRes = await fetch(dlUrl);
            const buffer = await mediaRes.buffer();

            let sentMsg;
            if (isAudio) {
                sentMsg = await conn.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: "audio/mp4", 
                    fileName: `${videoInfo.title}.mp3` 
                }, { quoted: m });
            } else {
                sentMsg = await conn.sendMessage(m.chat, { 
                    video: buffer, 
                    caption: `❑ *${videoInfo.title}*`, 
                    mimetype: "video/mp4" 
                }, { quoted: m });
            }

            await supabase
                .from('youtube_downloads')
                .insert([
                    { 
                        whatsapp_id: sentMsg.key.id, 
                        video_id: videoId, 
                        title: videoInfo.title,
                        type: isAudio ? 'audio' : 'video'
                    }
                ]);

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
            console.error(error);
            conn.reply(m.chat, `*── 「 ERROR PRIVADO 」 ──*\n\nIntente más tarde.`, m);
        }
    }
};

export default youtubeCommand;
