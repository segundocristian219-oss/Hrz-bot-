import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const vokerForwardHack = {
    name: 'vforward',
    alias: ['fwd', 'superpremium'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🛡️');

            const message = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: text || 'Este es un mensaje con identidad de sistema.',
                    contextInfo: {
                        // FORZAMOS el estado de reenvío masivo
                        isForwarded: true,
                        forwardingScore: 999,
                        // INYECTAMOS la identidad del Canal para "tapar" la etiqueta genérica
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            // ESTE ES EL NOMBRE QUE REEMPLAZA LA IDENTIDAD VISUAL
                            newsletterName: 'VOKER-SYSTEM-OFFICIAL' 
                        },
                        // Segunda capa: Etiqueta de "Publicidad" o "Verificado"
                        externalAdReply: {
                            title: 'VOKER-SYSTEM-V2',
                            body: 'Contenido de Alta Prioridad',
                            mediaType: 1,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            showAdAttribution: true 
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [FORWARD HACK ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerForwardHack;
