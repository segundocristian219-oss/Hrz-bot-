import axios from 'axios';

const testPreviewsPlugin = {
    name: 'test-previews',
    alias: ['tpv', 'fulltest'],
    category: 'tools',
    run: async (m, { conn }) => {
        const targetUrl = "https://github.com/DeylinQ/";
        const thumbUrl = "https://picsum.photos/800/600"; // Imagen random
        
        // Obtenemos el buffer una sola vez para eficiencia
        const response = await axios.get(thumbUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // --- VARIANTE 1: MINIATURA ESTÁNDAR (ESTILO NEKO'S) ---
        // Es la más limpia, la imagen aparece pequeña a la derecha.
        await conn.sendMessage(m.chat, {
            text: `*Variante 1: Estilo Neko's*\nEsta versión usa la miniatura clásica lateral.\n\nLink: ${targetUrl}`,
            contextInfo: {
                externalAdReply: {
                    title: "Deylin | Automation System",
                    body: "Haz clic para ir al repositorio",
                    previewType: "PHOTO",
                    thumbnail: buffer,
                    sourceUrl: targetUrl,
                    mediaType: 1,
                    renderLargerThumbnail: false // Miniatura pequeña
                }
            }
        }, { quoted: m });

        // --- VARIANTE 2: MINIATURA GRANDE (FULL CARD) ---
        // Ideal para captar atención, la imagen ocupa todo el ancho.
        await conn.sendMessage(m.chat, {
            text: `*Variante 2: Formato Grande*\nIdeal para catálogos o anuncios visuales.\n\nLink: ${targetUrl}`,
            contextInfo: {
                externalAdReply: {
                    title: "SISTEMA ACTUALIZADO v2.0",
                    body: "Estructura Minimalista Detectada",
                    previewType: "PHOTO",
                    thumbnail: buffer,
                    sourceUrl: targetUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true // Imagen grande
                }
            }
        }, { quoted: m });

        // --- VARIANTE 3: MODO "FORWARD" CON MENCIONES ---
        // Réplica exacta de lo que pediste: reenviado + mención + link.
        await conn.sendMessage(m.chat, {
            text: `❀ *BIENVENIDO* ✰ @${m.sender.split('@')[0]}\n\n> Esta es la réplica exacta con forwarding activado.\n\n${targetUrl}`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: "Neko's Club Replica",
                    body: "Héctor, Made with ❤️",
                    mediaType: 1,
                    thumbnail: buffer,
                    sourceUrl: targetUrl,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m });
    }
};

export default testPreviewsPlugin;
