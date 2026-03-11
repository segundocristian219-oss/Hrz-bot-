import axios from 'axios';

const threadsCommand = {
    name: 'threads',
    alias: ['th', 'threadsdl'],
    category: 'descargas',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`Ingresa un enlace.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.com/@user/post/ID`);

        try {
            const { data } = await axios.get(args[0], {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            });

            // Extraemos la URL de los metadatos
            let mediaUrl = data.match(/<meta[^>]*property="og:video"[^>]*content="([^"]*)"/)?.[1] || 
                           data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1];

            if (!mediaUrl) return m.reply("No se encontró contenido multimedia visible.");

            // LIMPIEZA CRÍTICA: Threads usa &amp; en el HTML que rompe la URL al descargar
            mediaUrl = mediaUrl.replace(/&amp;/g, '&');

            const description = data.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] || 'Threads Content';
            const isVideo = data.includes('og:video');
            const type = isVideo ? 'video' : 'image';

            const res = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(res.data, 'binary');

            await conn.sendMessage(m.chat, { 
                [type]: buffer, 
                caption: `> ╰✰ ${description}`,
                mimetype: isVideo ? 'video/mp4' : 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error('Threads Error:', error.message);
            m.reply("❌ Error al conectar con Threads. Verifica que el post sea público.");
        }
    }
};

export default threadsCommand;
