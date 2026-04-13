import axios from 'axios';
import { generateWAMessageContent } from '@whiskeysockets/baileys';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        /*if (!/video|audio/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video para generar la vista de música de canal.`, m);
        }*/

        try {
            m.react('🕒');

            const media = "https://api.dix.lat/media2/1776116143135.mp4";
            const title = text.split('|')[0]?.trim() || "Set Fire to the Rain";
            const author = text.split('|')[1]?.trim() || "Adele";
            const albumArt = "https://api.dix.lat/media2/1773637265253.jpg";

            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    caption: `🎵 ${author} - ${title}`,
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
                            sourceUrl: "https://www.instagram.com/reels/audio/227020654558518/",
                            mediaUrl: "https://www.instagram.com/reels/audio/227020654558518/"
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.2, y: 0.3 },
                                { x: 0.8, y: 0.3 },
                                { x: 0.8, y: 0.7 },
                                { x: 0.2, y: 0.7 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "227020654558518",
                                    songId: "227020654558518",
                                    author: author,
                                    title: title,
                                    artworkDirectPath: albumArt,
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
