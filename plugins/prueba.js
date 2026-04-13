import axios from 'axios';
import { generateWAMessageContent } from '@whiskeysockets/baileys';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (!/video|audio/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video para generar la vista de música de canal.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();
            const title = text.split('|')[0]?.trim() || "Sin Título";
            const author = text.split('|')[1]?.trim() || "Desconocido";
            const albumArt = "https://api.dix.lat/media2/1773637265253.jpg";

            const messageContent = await generateWAMessageContent(
                { 
                    video: media, 
                    mimetype: 'video/mp4',
                    caption: `🎵 ${author} - ${title}`
                },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    viewOnce: false,
                    gifPlayback: false,
                    
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363302772535780@newsletter',
                            newsletterName: 'Kirito ♕ — Official Channel ™',
                            serverMessageId: 1
                        },
                        externalAdReply: {
                            title: title,
                            body: author,
                            mediaType: 2,
                            renderLargerThumbnail: true,
                            thumbnailUrl: albumArt,
                            sourceUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29",
                            mediaUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29"
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.1, y: 0.1 },
                                { x: 0.9, y: 0.1 },
                                { x: 0.9, y: 0.2 }, // Reducido para que la etiqueta flote arriba
                                { x: 0.1, y: 0.2 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                   
                                    musicContentMediaId: `${Math.floor(Math.random() * 100000000000000)}`,
                                    songId: `${Math.floor(Math.random() * 100000000000000)}`,
                                    author: author,
                                    title: title,
                                    artworkDirectPath: albumArt,
                                    artworkSha256: videoMsg.fileSha256, 
                                    artistAttribution: author.toLowerCase(),
                                    isExplicit: false,
                                    musicSongStartTimeInMs: 0,
                                    derivedContentStartTimeInMs: 0,
                                    overlapDurationInMs: 30000
                                }
                            },
                            embeddedAction: true
                        }
                    ]
                }
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default musicViewCommand;
