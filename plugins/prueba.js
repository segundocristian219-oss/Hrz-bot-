import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerBruteForceV4 = {
    name: 'vforce4',
    alias: ['hackfinal', 'inyectarvideo'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('⚡');

            const videoUrl = text || 'https://raw.githubusercontent.com/DeylinEliac/voker-assets/main/video_demo.mp4';
            
            // Descargamos el video para enviarlo como DATA, no como LINK
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    // Inyectamos el buffer directamente
                    video: videoBuffer, 
                    mimetype: 'video/mp4',
                    caption: `*── 「 VOKER PREMIUM 」 ──*`,
                    gifPlayback: true,
                    gifAttribution: 1, 
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // Este es el campo que "engaña" la etiqueta de GIPHY
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'VOKER-SYSTEM-V2' 
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // Enviamos sin pasar por los filtros de la librería
            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id 
            });

            m.react('✅');

        } catch (error) {
            console.error(`> [FATAL ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerBruteForceV4;
