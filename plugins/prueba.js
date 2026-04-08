const geturl = {
    name: 'geturl',
    category: 'tools',
    run: async (conn, m) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image|video|audio|sticker|document/.test(mime)) {
            await conn.sendMessage(m.chat, { react: { text: '❓', key: m.key } });
            return m.reply('❌ Debes responder a un archivo (imagen, video, audio, etc.)');
        }

        try {
            await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const media = await quoted.download?.() || await conn.downloadMediaMessage(quoted);
            if (!media) {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('❌ No se pudo descargar el archivo.');
            }

            let mediaType = 'document';
            if (/image/.test(mime)) mediaType = 'image';
            else if (/video/.test(mime)) mediaType = 'video';
            else if (/audio/.test(mime)) mediaType = 'audio';

            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mediaType 
            });

            const directUrl = upload.url;

            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await conn.sendMessage(m.chat, { 
                text: directUrl 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply('❌ Error interno al subir al servidor.');
        }
    }
};

export default geturl;
