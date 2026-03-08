import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerStealthBrand = {
    name: 'vbrandfinal',
    alias: ['vfinal', 'fuerza'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧪');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: `*── 「 VOKER SYSTEM BRAND 」 ──*`,
                    gifPlayback: true,
                    gifAttribution: 1, // Activamos el espacio de etiqueta
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // ESTE ES EL NOMBRE QUE QUEREMOS INYECTAR
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        sourceUrl: 'https://dix.lat',
                        showAdAttribution: true
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // RELAY SIN ATRIBUTOS EXTRA (Limpieza total del nodo)
            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id 
            });

            m.react('✅');

        } catch (error) {
            console.error('> [FATAL ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerStealthBrand;
