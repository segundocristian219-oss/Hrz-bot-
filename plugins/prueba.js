import axios from 'axios';

const vokerVideoCommand = {
    name: 'vvideo',
    alias: ['vgif', 'etiqueta'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            // URL de video random (puedes cambiarla por cualquier link directo a un mp4)
            const videoUrl = text || 'https://api.dix.lat/media/1772941561826_pQa-g7DfE.mp4';

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: `*── 「 VIDEO ATTRIBUTION 」 ──*\n\n> 🎬 Video enviado con etiqueta oficial.\n\n*❯ Proveedor:* GIPHY`,
                mimetype: 'video/mp4',
                // EL TRUCO: Enviamos true para la etiqueta, pero WhatsApp lo tratará como video por el mimetype
                gifPlayback: true, 
                gifAttribution: "GIPHY",
                contextInfo: {
                    externalAdReply: {
                        title: 'Voker Systems Official Content',
                        body: 'Verified Media via GIPHY',
                        mediaType: 2,
                        // Aquí podrías poner una miniatura si quisieras
                        thumbnailUrl: 'https://dix.lat/logo.png', 
                        sourceUrl: 'https://dix.lat'
                    }
                }
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerVideoCommand;
