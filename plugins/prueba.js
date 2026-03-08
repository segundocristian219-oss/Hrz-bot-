import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerQuickBrand = {
    name: 'vbrand',
    alias: ['instant', 'vmark'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('⚡');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: `*── 「 VOKER SYSTEM 」 ──*`,
                    gifPlayback: true,
                    // NO usamos gifAttribution para que el servidor no valide contra GIPHY
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        // Inyectamos la marca en el label de fuente
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        // Usamos un JID que no sea de Newsletter para evitar el botón de "Ver Canal"
                        // Pero que fuerce al sistema a mostrar la procedencia.
                        forwardedInternalMessageContextInfo: {
                            sourceLabel: 'VOKER-SYSTEM-V2'
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id 
            });

            m.react('✅');

        } catch (error) {
            console.error('> [INSTANT ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerQuickBrand;
