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
            return conn.reply(m.chat, `> ⍰ Responde a un video o audio para enviarlo con esa estructura.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();
            const title = text.split('|')[0]?.trim() || "Set Fire to the Rain";
            const author = text.split('|')[1]?.trim() || "Adele";
            const albumArt = "https://api.dix.lat/media2/1773637265253.jpg";

            const messageContent = await generateWAMessageContent(
                { audio: media, mimetype: 'audio/mp4' },
                { upload: conn.waUploadToServer }
            );

            const audioMsg = messageContent.audioMessage;

            await conn.relayMessage(m.chat, {
                audioMessage: {
                    ...audioMsg,
                    seconds: 30,
                    ptt: false,
                    contextInfo: {
                        externalAdReply: {
                            title: title,
                            body: author,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            thumbnailUrl: albumArt,
                            sourceUrl: "https://www.instagram.com/reels/audio/227020654558518/",
                            mediaUrl: "https://www.instagram.com/reels/audio/227020654558518/"
                        },
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363302772535780@newsletter',
                            newsletterName: 'Kirito ♕ — Official Channel ™',
                            serverMessageId: 1
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.25, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.5844531059265137 },
                                { x: 0.25, y: 0.5844531059265137 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "227020654558518",
                                    songId: "227020654558518",
                                    author: author,
                                    title: title,
                                    artworkDirectPath: albumArt,
                                    artistAttribution: "adele",
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
