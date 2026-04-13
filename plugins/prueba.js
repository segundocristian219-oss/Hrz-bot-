import axios from 'axios';
import { generateWAMessageContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (!/video/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();

            const title = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "VOKER SYSTEM";

            const albumArtBuffer = Buffer.from([
                // Aquí iría el buffer real si lo descargas, pero como ya tienes los datos del RAW,
                // usamos directamente los valores que proporcionaste para mayor precisión
            ]);

            // Valores reales extraídos del RAW de la imagen que enviaste
            const artworkDirectPath = "/o1/v/t24/f2/m233/AQMCVKtzxZNrCzCkWeOp0caplPmgYRHO8BnnpKJbRgLxIt4W_1OJcXi-rqs5KtAzohRoaLn5Aaw_Oq6Z5xLFIrcV6m9LS15X7evpnki3qw?ccb=9-4&oh=01_Q5Aa4QFKBPLxiAs_hmQ25ZYfblRTkdJvaa6K1BvwjZamGR2D5Q&oe=6A04E169&_nc_sid=e6ed6c";
            const artworkSha256 = "Mu3vWZIEchc8t37PVeXjWjqa9KKOIvpg+ZqiLODSy9g=";
            const artworkEncSha256 = "cjNby1GyeST6xELalOQtWAuaPm0/Ji4OvClEobUIFMA=";
            const artworkMediaKey = "oRGI3/6buCDH2zXNTMpvT8pn180LBfvhUwV5tSfPd5Y=";

            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            const trackId = crypto.randomBytes(16).toString('hex');

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", 'base64'), // thumbnail mínimo
                    contextInfo: {
                        forwardingScore: 2,
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
                                { x: 0.25, y: 0.42 },
                                { x: 0.75, y: 0.42 },
                                { x: 0.75, y: 0.58 },
                                { x: 0.25, y: 0.58 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: trackId,
                                    songId: trackId,
                                    author: author,
                                    title: title,
                                    artistAttribution: author,
                                    artworkDirectPath: artworkDirectPath,
                                    artworkSha256: artworkSha256,
                                    artworkEncSha256: artworkEncSha256,
                                    artworkMediaKey: artworkMediaKey,
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
            m.react('❌');
            conn.reply(m.chat, `> ❌ *Error:* ${error.message}`, m);
        }
    }
};

export default musicViewCommand;