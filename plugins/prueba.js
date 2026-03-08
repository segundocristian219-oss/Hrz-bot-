import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerOfficialTests = {
    name: 'vbrand',
    alias: ['oficial', 'vokerbrand'],
    category: 'system',
    run: async (m, { conn, text }) => {
        m.react('🧪');

        const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
        let videoBuffer;

        try {
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            videoBuffer = Buffer.from(response.data);
        } catch (e) {
            return m.react('❌');
        }

        // --- PRUEBA 1: ETIQUETA DE MIEMBRO (NATIVA 2026) ---
        // Esta es la más limpia: texto puro bajo el nombre del bot.
        try {
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: '*── 「 VOKER SYSTEM v5: MÉTODO NATIVO 」 ──*',
                gifPlayback: true,
                contextInfo: {
                    mentionedJid: [m.sender],
                    // En 2026, este campo inyecta la "Etiqueta de Miembro" oficial
                    externalAdReply: {
                        title: 'VOKER-SYSTEM-OFFICIAL',
                        body: 'Desarrollador Independiente',
                        showAdAttribution: false, // Quitamos el botón de canal
                        renderLargerThumbnail: false,
                        mediaType: 1
                    }
                }
            }, { quoted: m });
        } catch (e) { console.error('Fallo Método 1'); }

        // --- PRUEBA 2: FOOTER DE UTILIDAD (ESTÉTICA EMPRESARIAL) ---
        // Pone tu marca en gris pequeño al final del mensaje, sin botones.
        try {
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: '*── 「 VOKER SYSTEM v5: MÉTODO FOOTER 」 ──*',
                gifPlayback: true,
                footer: 'VOKER-SYSTEM-V2 | DEYLIN ELIAC',
                viewOnce: false
            }, { quoted: m });
        } catch (e) { console.error('Fallo Método 2'); }

        // --- PRUEBA 3: SOURCE LABEL (STAY CLEAN) ---
        // Intenta poner el nombre arriba del video sin URL asociada.
        try {
            const msg3 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 VOKER SYSTEM v5: SOURCE LABEL 」 ──*',
                    gifPlayback: true,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        sourceUrl: '' // Vacío para no generar botón
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg3.message, { messageId: msg3.key.id });
        } catch (e) { console.error('Fallo Método 3'); }

        // --- PRUEBA 4: NEWSLETTER JID 0 (ÚLTIMO RECURSO) ---
        // Intenta forzar el color verde pero con un ID nulo para romper el botón.
        try {
            const msg4 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 VOKER SYSTEM v5: GHOST NEWSLETTER 」 ──*',
                    gifPlayback: true,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '0@newsletter',
                            serverMessageId: 1,
                            newsletterName: 'VOKER-SYSTEM-V2'
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg4.message, { messageId: msg4.key.id });
        } catch (e) { console.error('Fallo Método 4'); }

        m.react('✅');
    }
};

export default vokerOfficialTests;
