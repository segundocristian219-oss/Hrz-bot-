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

            // Usamos downloadM que es el método de descarga de tu Bot
            const media = await conn.downloadM(quoted, mime.split('/')[0]);
            
            if (!media) {
                await sendReaction('❌');
                return sendMsg('❌ No se pudo descargar el archivo.');
            }

            // Usamos waUploadToServer con el buffer obtenido de tu función nativa
            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mime.split('/')[0] || 'document'
            });

            if (upload && upload.url) {
                await sendReaction('✅');
                await sendMsg(upload.url);
            } else {
                throw new Error("Sin respuesta del servidor");
            }

        } catch (e) {
            console.error(e);
            await sendReaction('❌');
            sendMsg('❌ Error al procesar el archivo en el servidor de WhatsApp.');
        }
    }
};

export default geturl;
