const geturl = {
    name: 'geturl',
    category: 'tools',
    run: async (conn, m) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image|video|audio|sticker|document/.test(mime)) {
            await m.react('❓');
            return m.reply('❌ Responde a una imagen, video o archivo para obtener su URL.');
        }

        try {
            await m.react('⏳');

            const media = await quoted.download();
            if (!media || media.length === 0) {
                await m.react('❌');
                return m.reply('❌ No se pudo descargar el archivo del servidor de WhatsApp.');
            }

            let mediaType = 'document';
            if (/image/.test(mime)) mediaType = 'image';
            else if (/video/.test(mime)) mediaType = 'video';
            else if (/audio/.test(mime)) mediaType = 'audio';

            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mediaType 
            });

            await m.react('✅');
            await m.reply(upload.url);

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply('❌ Ocurrió un error al intentar subir el archivo.');
        }
    }
};

export default geturl;
