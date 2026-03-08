import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerCleanLabel = {
    name: 'vbrand',
    alias: ['vokerlabel', 'clean'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🏷️');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: `*── 「 VOKER SYSTEM 」 ──*`,
                    gifPlayback: true,
                    gifAttribution: 1, // Mantenemos esto para reservar el espacio de la etiqueta
                    contextInfo: {
                        // EL HACK PARA EVITAR BOTONES:
                        // Usamos sourceLabel para el nombre, pero dejamos sourceUrl vacío.
                        // Esto hace que aparezca el nombre en la parte superior sin ser un link.
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        sourceUrl: '', 
                        isForwarded: true,
                        forwardingScore: 1,
                        // NO incluir forwardedNewsletterMessageInfo para que no aparezca el botón de canal.
                        // NO incluir externalAdReply para que no aparezca la "publicidad" de la miniatura.
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error('> [ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerCleanLabel;
