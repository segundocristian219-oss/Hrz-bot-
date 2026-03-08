import axios from 'axios';

const vokerVideoCleanCommand = {
    name: 'vvideo2',
    alias: ['vclean', 'etiquetapura'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: `*── 「 VIDEO CON ETIQUETA 」 ──*\n\n> 🎬 Video normal con atribución oficial.`,
                mimetype: 'video/mp4',
                // Enviamos la atribución pero NO el playback de GIF para que sea un video normal
                gifAttribution: name()
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerVideoCleanCommand;
