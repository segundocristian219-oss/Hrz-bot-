import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const vokerGreenFinal = {
    name: 'vgreen2',
    alias: ['vokerlabel'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧬');

            const message = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: text || 'Contenido Premium Voker System',
                    contextInfo: {
                        isForwarded: true,
                        // Mantenemos 1 para que no aparezca "Reenviado muchas veces"
                        // y permita mostrar tu nombre personalizado.
                        forwardingScore: 1, 
                        forwardedNewsletterMessageInfo: {
                            // JID genérico para activar el color verde y el nombre
                            newsletterJid: '0@newsletter', 
                            serverMessageId: 1,
                            // ESTE ES TU NOMBRE EN VERDE
                            newsletterName: 'VOKER-SYSTEM-V2' 
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [GREEN ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerGreenFinal;
