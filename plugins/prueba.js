import axios from 'axios';

const premiumVideoCommand = {
    name: 'vpremium',
    alias: ['vokerlabel'],
    category: 'fun',
    run: async (m, { conn, text }) => {
        try {
            m.react('🕒');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            
            // Obtenemos el video como buffer para asegurar que los metadatos se inyecten correctamente
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data, 'utf-8');

            await conn.sendMessage(m.chat, { 
                video: videoBuffer, 
                caption: `*── 「 VOKER PREMIUM 」 ──*`,
                mimetype: 'video/mp4',
                // Engaño: Activamos esto para la etiqueta, pero el buffer de video normal mantendrá sus propiedades
                gifPlayback: true, 
                gifAttribution: "huijc", // Usar 1 (GIPHY) o 2 (TENOR) fuerza la aparición del logo en el chat
                contextInfo: {
                    // Esto ayuda a que el sistema lo vea como contenido de plataforma
                    isForwarded: true,
                    forwardingScore: 999
                }
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default premiumVideoCommand;
