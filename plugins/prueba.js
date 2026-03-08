import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerGiphyHack = {
    name: 'vhack',
    alias: ['nombregif', 'vlabelgif'],
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
                    caption: `*── 「 VOKER SYSTEM HACK 」 ──*`,
                    gifPlayback: true, // Se envía como GIF para activar la etiqueta
                    gifAttribution: 1, // Reservamos el espacio de GIPHY
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // EL HACK: Inyectamos metadatos de Newsletter para cambiar el nombre
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'VOKER-SYSTEM-V2' // ESTE ES EL NOMBRE QUE APARECERÁ
                        },
                        // Opcional: Esto añade una segunda capa de marca
                        externalAdReply: {
                            title: 'CONTENIDO PREMIUM',
                            mediaType: 2,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            showAdAttribution: true
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [HACK ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerGiphyHack;
