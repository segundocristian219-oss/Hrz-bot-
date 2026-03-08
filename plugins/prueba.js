import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerBrandingSystem = {
    name: 'vbrand',
    alias: ['marcar', 'vokerlogo'],
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
                    caption: `*── 「 PROPIEDAD DE VOKER SYSTEM 」 ──*\n\n_Contenido generado y verificado mediante motor de automatización profesional._`,
                    gifPlayback: true,
                    gifAttribution: 1, // Espacio reservado para etiqueta
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // INYECCIÓN DE MARCA DE AGUA DIGITAL
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'DEYLIN-ELIAC | VOKER-SYSTEM' // TU ETIQUETA DE MARCA
                        },
                        // CABECERA DE VERIFICACIÓN
                        externalAdReply: {
                            title: 'VOKER AUTOMATION ENGINE v5.0',
                            body: 'Verified Independent Developer',
                            mediaType: 2,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            sourceUrl: 'https://dix.lat',
                            showAdAttribution: true
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error('> [BRANDING ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerBrandingSystem;
