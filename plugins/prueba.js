import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerGiphyHackRaw = {
    name: 'vokerraw',
    alias: ['inyectar'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧬');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    url: videoUrl,
                    mimetype: 'video/mp4',
                    fileLength: buffer.length,
                    seconds: 3,
                    gifPlayback: true, 
                    // Engañamos al enumerador para que abra el espacio de etiqueta
                    gifAttribution: 1, 
                    contextInfo: {
                        // FUERZA BRUTA: Inyectamos tu nombre donde el sistema espera el origen
                        sourceLabel: 'VOKER-SYSTEM-V2', 
                        sourceUrl: 'https://dix.lat',
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            // Este campo suele pisar visualmente a "GIPHY" en versiones modernas
                            newsletterName: 'VOKER-SYSTEM-V2' 
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // Enviamos el mensaje crudo al socket
            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [RAW HACK ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerGiphyHackRaw;
