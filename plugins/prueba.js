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
            if (!media) {
                await sendReaction('❌');
                return sendMsg('❌ No se pudo descargar el archivo.');
            }

            // En lugar de pasar un objeto complejo, pasamos el buffer y el stream de carga
            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime
            });

            if (!upload || !upload.url) {
                throw new Error("No se generó URL de carga");
            }

            await sendReaction('✅');
            await sendMsg(upload.url);

        } catch (e) {
            console.error(e);
            await sendReaction('❌');
            sendMsg('❌ Error interno al subir a los servidores de WhatsApp.');
        }
    }
};

export default geturl;
