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
            return sendMsg('❌ Responde a una imagen, video o archivo para obtener su URL.');
        }

        try {
            await sendReaction('⏳');
            const media = await quoted.download();
            
            if (!media || media.length === 0) {
                await sendReaction('❌');
                return sendMsg('❌ No se pudo descargar el archivo.');
            }

            let mediaType = 'document';
            if (/image/.test(mime)) mediaType = 'image';
            else if (/video/.test(mime)) mediaType = 'video';
            else if (/audio/.test(mime)) mediaType = 'audio';

            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mediaType 
            });

            await sendReaction('✅');
            await sendMsg(upload.url);
        } catch (e) {
            console.error(e);
            await sendReaction('❌');
            sendMsg('❌ Error al subir a los servidores de WhatsApp.');
        }
    }
};

export default geturl;
