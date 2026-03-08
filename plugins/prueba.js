import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerBruteForceFinal = {
    name: 'vforcefinal',
    alias: ['hackdirecto', 'sendforce'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧪');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            // Construimos el mensaje crudo
            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    url: videoUrl,
                    mimetype: 'video/mp4',
                    fileLength: buffer.length,
                    seconds: 3,
                    gifPlayback: true,
                    gifAttribution: 1, // Mantenemos el espacio para la etiqueta
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // Inyectamos el nombre del sistema como si fuera un canal oficial
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'VOKER-SYSTEM-V2' 
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // ENGAÑO DE NIVEL BAJO: Enviamos directamente al socket
            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id,
                additionalAttributes: {
                    // Este atributo le dice a WhatsApp que el mensaje ya fue validado por un servidor de plataforma
                    'data-binary': 'true'
                }
            });

            m.react('✅');

        } catch (error) {
            console.error(`> [FATAL BRUTE FORCE]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerBruteForceFinal;
