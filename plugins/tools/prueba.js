import axios from 'axios';

const fullTestPlugin = {
    name: 'fulltest',
    alias: ['ft'],
    category: 'tools',
    run: async (m, { conn }) => {
        const url = "https://github.com/DeylinQ/";
        const img = "https://picsum.photos/1200/800";
        const res = await axios.get(img, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        await conn.sendMessage(m.chat, {
            text: `ESTRUCTURA TIPO A (LARGE AD)\n${url}`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1,
                isForwarded: true,
                externalAdReply: {
                    title: "DEYLIN SYSTEM v3",
                    body: "CLICK AQUÍ PARA REDIRIGIR",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: buffer,
                    sourceUrl: url,
                    mediaUrl: url,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            text: `ESTRUCTURA TIPO B (VIDEO SIMULADO)\n${url}`,
            contextInfo: {
                externalAdReply: {
                    title: "MULTIMEDIA REDIRECT",
                    body: "ESTRUCTURA DE VIDEO",
                    mediaType: 2,
                    renderLargerThumbnail: true,
                    thumbnail: buffer,
                    sourceUrl: url,
                    mediaUrl: url
                }
            }
        });

        await conn.sendMessage(m.chat, {
            text: `ESTRUCTURA TIPO C (DOCUMENT STYLE)\n${url}`,
            contextInfo: {
                externalAdReply: {
                    title: "SYSTEM DOCUMENT",
                    body: "SOURCE URL TEST",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: buffer,
                    sourceUrl: url,
                    containsAutoReply: true,
                    type: 'UA'
                }
            }
        });

        const msg = {
            extendedTextMessage: {
                text: `ESTRUCTURA TIPO D (RELAY RAW)\n${url}`,
                matchedText: url,
                canonicalUrl: url,
                description: "DESCRIPCIÓN DE PRUEBA",
                title: "TITULO ESTRUCTURA RAW",
                jpegThumbnail: buffer,
                previewType: "PHOTO",
                contextInfo: {
                    externalAdReply: {
                        title: "RELIANCE TEST",
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnail: buffer,
                        sourceUrl: url
                    }
                }
            }
        };
        await conn.relayMessage(m.chat, msg, { quoted: m });
    }
};

export default fullTestPlugin;
