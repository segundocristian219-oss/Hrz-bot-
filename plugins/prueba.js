import axios from 'axios';

const threadsCommand = {
    name: 'threads',
    alias: ['th', 'threadsdl'],
    category: 'descargas',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`Escribe un enlace de Threads.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.net/@user/post/ID`);

        try {
            const url = args[0];
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            const video = data.match(/<meta[^>]*property="og:video"[^>]*content="([^"]*)"/)?.[1];
            const image = data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1];
            const description = data.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] || 'Threads Content';

            const mediaUrl = video || image;
            if (!mediaUrl) return m.reply("No se encontró contenido multimedia.");

            const type = video ? 'video' : 'image';
            const res = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(res.data, 'binary');

            await conn.sendMessage(m.chat, { 
                [type]: buffer, 
                caption: `> ╰✰ ${description}`,
                mimetype: type === 'video' ? 'video/mp4' : 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error('Threads Error:', error.message);
            m.reply("❌ Error al procesar el enlace.");
        }
    }
};

export default threadsCommand;
