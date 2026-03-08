import axios from 'axios';

const vokerCustomLabelCommand = {
    name: 'vlabel',
    alias: ['vokerbrand'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data, 'utf-8');

            await conn.sendMessage(m.chat, { 
                video: videoBuffer, 
                caption: `*── 「 VOKER SYSTEM 」 ──*`,
                mimetype: 'video/mp4',
                // IMPORTANTE: Eliminamos gifPlayback para que sea VIDEO NORMAL
                gifPlayback: false, 
                contextInfo: {
                    externalAdReply: {
                        // AQUÍ PONES TU NOMBRE PERSONALIZADO
                        title: 'VOKER-SYSTEM-V2', 
                        body: 'Contenido Verificado',
                        mediaType: 2,
                        // Logo de tu bot para que se vea más profesional
                        thumbnailUrl: 'https://dix.lat/logo.png', 
                        sourceUrl: 'https://dix.lat',
                        // Esto fuerza a que se vea como un contenido de marca propia
                        showAdAttribution: true 
                    },
                    // Mantenemos esto para el estilo Premium
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerCustomLabelCommand;
