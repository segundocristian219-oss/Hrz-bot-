const geturl = {
    name: 'geturl',
    category: 'tools',
    run: async (conn, m) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        const sendReaction = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
        const sendMsg = (text) => conn.sendMessage(m.chat, { text: text }, { quoted: m });

        if (!/image|video|audio|sticker|document/.test(mime)) {
            await sendReaction('❓');
            return sendMsg('❌ Responde a un archivo para obtener su URL.');
        }

        try {
            await sendReaction('⏳');
            
            // Usamos la función download que ya viene en tu objeto m
            const media = await quoted.download();
            
            if (!media) {
                await sendReaction('❌');
                return sendMsg('❌ No se pudo descargar el archivo.');
            }

            let mediaType = 'document';
            if (/image/.test(mime)) mediaType = 'image';
            else if (/video/.test(mime)) mediaType = 'video';
            else if (/audio/.test(mime)) mediaType = 'audio';

            // Subida directa al servidor de WhatsApp
            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mediaType 
            });

            if (upload && upload.url) {
                await sendReaction('✅');
                await sendMsg(upload.url);
            } else {
                throw new Error("URL no generada");
            }

        } catch (e) {
            console.error(e);
            await sendReaction('❌');
            sendMsg('❌ Error al procesar la subida.');
        }
    }
};

export default geturl;
