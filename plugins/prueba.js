import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerGhostBrand = {
    name: 'vbrand',
    alias: ['vmark', 'ghost'],
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
                    contextInfo: {
                        // FORZAMOS LA IDENTIDAD SIN CANAL
                        isForwarded: true,
                        forwardingScore: 1,
                        // El truco: sourceLabel es el único que no genera botones
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        // Inyectamos un JID inexistente para que el sistema intente 
                        // resolver el nombre pero solo muestre el texto de la marca.
                        participant: '0@s.whatsapp.net',
                        remoteJid: 'status@broadcast'
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id 
            });

            m.react('✅');

        } catch (error) {
            console.error('> [PROTOCOL ERROR]:', error.message);
            m.react('❌');
        }
    }
};

export default vokerGhostBrand;
