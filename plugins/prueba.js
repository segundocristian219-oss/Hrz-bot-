import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const vokerCleanGreenCommand = {
    name: 'vgreen',
    alias: ['verdepuro', 'cleanlabel'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧪');

            const message = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: text || 'Mensaje con etiqueta limpia.',
                    contextInfo: {
                        // Forzamos el estado de reenvío para activar el renderizado de etiquetas
                        isForwarded: true,
                        forwardingScore: 1,
                        // HACK: Inyectamos el nombre en el label de origen
                        // Esto suele aparecer en verde en la parte superior sin crear un botón de canal
                        sourceLabel: 'VOKER-SYSTEM-V2', 
                        // Dejamos estos campos vacíos o inexistentes para quitar la vista previa y el link
                        sourceUrl: '', 
                        externalAdReply: null, 
                        // No incluimos forwardedNewsletterMessageInfo para evitar el botón de "Ver canal"
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [CLEAN GREEN ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerCleanGreenCommand;
