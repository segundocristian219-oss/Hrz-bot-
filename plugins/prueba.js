import axios from 'axios';

export c {
    name: 'threads',
    alias: ['threadsdl', 'th'],
    category: 'download',
    description: 'Descarga videos o fotos de Threads',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`❀ Ingresa un enlace de Threads.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.net/@user/post/ID`);

        try {
            const url = args[0];
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate'
                }
            });

            const video = data.match(/<meta[^>]*property="og:video"[^>]*content="([^"]*)"/)?.[1];
            const image = data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1];
            const description = data.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] || 'Threads Content';

            const mediaUrl = video || image;
            if (!mediaUrl) return m.reply('> ╰❒ No se pudo extraer contenido multimedia de este enlace.');

            const type = video ? 'video' : 'image';
            const res = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(res.data, 'utf-8');

            await conn.sendMessage(m.chat, { 
                [type]: buffer, 
                caption: `> ╰✰ ${description}`,
                mimetype: type === 'video' ? 'video/mp4' : 'image/jpeg'
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('> ╰❒ Error al procesar el enlace. Asegúrate de que el post sea público.');
        }
    }
};

export default c