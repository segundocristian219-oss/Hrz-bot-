import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerBruteForceV2 = {
    name: 'vforce2',
    alias: ['hacklabel2', 'fuerzatotal'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('⚡');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            // CREACIÓN DEL PROTOBUFF CON ENGAÑO DE ORIGEN
            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    url: videoUrl,
                    mimetype: 'video/mp4',
                    fileLength: buffer.length,
                    caption: `*── 「 VOKER SYSTEM FORCE 」 ──*`,
                    // Forzamos el envío como GIF para activar la etiqueta negra
                    gifPlayback: true, 
                    gifAttribution: 1, // Simulamos GIPHY para que el cliente abra el espacio de la etiqueta
                    contextInfo: {
                        // AQUÍ ESTÁ EL HACK: Sobreescribimos la etiqueta de plataforma
                        // Engañamos al visualizador para que use nuestro texto en lugar del nombre del proveedor
                        sourceLabel: 'VOKER-BOT-V2', 
                        sourceUrl: 'https://dix.lat',
                        externalAdReply: {
                            title: 'VOKER PREMIUM CONTENT',
                            body: 'Sistema Verificado',
                            mediaType: 2,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            showAdAttribution: true
                        },
                        isForwarded: true,
                        forwardingScore: 1000,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'Voker Systems Updates' // Nombre que aparecerá arriba del mensaje
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // RELAY MESSAGE: Envío de fuerza bruta directo al flujo de datos
            await conn.relayMessage(m.chat, message.message, { 
                messageId: message.key.id,
                additionalAttributes: {
                    // Forzamos el atributo de procedencia
                    category: 'platform_verified'
                }
            });

            m.react('✅');

        } catch (error) {
            console.error(`> [FATAL ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default vokerBruteForceV2;
