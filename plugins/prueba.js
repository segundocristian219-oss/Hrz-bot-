import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerUltimateLabel = {
    name: 'vbrand',
    alias: ['etiqueta', 'vokerbrand'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🏷️');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: `*── 「 SISTEMA VOKER 」 ──*`,
                    gifPlayback: true,
                    // QUITAMOS gifAttribution para evitar el bloqueo del servidor
                    contextInfo: {
                        // FORZAMOS LA ETIQUETA DE CANAL (Esta es tu nueva etiqueta de marca)
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter', // ID genérico
                            serverMessageId: 1,
                            newsletterName: 'VOKER-SYSTEM-OFFICIAL' // AQUÍ TU MARCA
                        },
                        isForwarded: true,
                        forwardingScore: 1,
                        // Añadimos una marca de agua visual extra
                        externalAdReply: {
                            title: 'VOKER AUTOMATION',
                            body: 'Desarrollador Independiente',
                            mediaType: 2,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            showAdAttribution: true
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // ENVÍO DIRECTO
            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error('> [BRAND ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerUltimateLabel;
