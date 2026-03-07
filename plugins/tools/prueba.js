import axios from 'axios';

const videoRedirectPlugin = {
    name: 'videoredirect',
    alias: ['vurl', 'redirect'],
    category: 'tools',
    run: async (m, { conn }) => {
        const url = "https://github.com/DeylinQ/";
        const img = "https://picsum.photos/1200/800";
        const res = await axios.get(img, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        await conn.sendMessage(m.chat, {
            text: `❀ *SISTEMA OPERATIVO* ✰\n\n> 🜸 ${url}`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: "DEYLIN AUTOMATION SYSTEM",
                    body: "CLICK PARA ACCEDER AL CONTENIDO",
                    mediaType: 2,
                    mediaUrl: url,
                    sourceUrl: url,
                    previewType: "VIDEO",
                    thumbnail: buffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: true,
                    containsAutoReply: true,
                    thumbnailUrl: img,
                    sourceId: "Deylin-Dev",
                    ctwaContext: {
                        sourceUrl: url,
                        description: "Neko's Club Style Redirect"
                    }
                }
            }
        }, { quoted: m });
    }
};

export default videoRedirectPlugin;
