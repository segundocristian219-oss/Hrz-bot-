import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerBruteForceCommand = {
    name: 'vforce',
    alias: ['hacklabel', 'fuerzabruta'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🔥');

            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            // Construcción del Proto con inyección de metadatos de "Fuerza Bruta"
            const message = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    url: videoUrl,
                    mimetype: 'video/mp4',
                    fileLength: buffer.length,
                    caption: `*── 「 VOKER SYSTEM FORCE 」 ──*`,
                    gifPlayback: false, // Desactivamos el bucle
                    // Inyectamos un valor de atribución fuera del rango estándar (1-2)
                    // Intentamos forzar al motor de renderizado a leer un string personalizado
                    gifAttribution: 3, 
                    contextInfo: {
                        // Forzamos la etiqueta de "Contenido de Voker" mediante el campo sourceUrl
                        sourceUrl: 'https://dix.lat',
                        sourceLabel: 'VOKER-SYSTEM-V2', // Aquí es donde engañamos al motor visual
                        showAdAttribution: true,
                        isForwarded: true,
                        forwardingScore: 1000
                    }
                }
            }, { userJid: conn.user.id, quoted: m });

            // Enviamos el nodo crudo al socket de WhatsApp
            await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });

            m.react('✅');

        } catch (error) {
            console.error(`> [BRUTE FORCE ERROR]: ${error.message}`);
            m.react('💀');
        }
    }
};

export default vokerBruteForceCommand;
