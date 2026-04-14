
import axios from 'axios';
import { generateWAMessageContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
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
            const title  = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "Deylin Tech";
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";
            const instagramShortcode = "DXF25DKDZrN";

            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const albumArtBuffer = Buffer.from(resp.data);

            // ✅ Subimos la imagen del álbum a los servidores de WhatsApp
            // igual que se sube cualquier imagen. Esto nos da directPath y mediaKey
            const uploadedArt = await prepareWAMessageMedia(
                { image: albumArtBuffer },
                { upload: conn.waUploadToServer }
            );

            // Extraemos los campos que WA necesita para mostrar la imagen
            const artDirectPath    = uploadedArt.imageMessage.directPath;
            const artMediaKey      = uploadedArt.imageMessage.mediaKey;
            const artSha256        = uploadedArt.imageMessage.fileSha256;
            const artEncSha256     = uploadedArt.imageMessage.fileEncSha256;

            // Subimos el video
            const messageContent = await generateWAMessageContent(
                {
                    video: media,
                    mimetype: 'video/mp4',
                    jpegThumbnail: albumArtBuffer
                },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: albumArtBuffer.toString('base64'),
                    thumbnailWidth: 480,
                    thumbnailHeight: 480,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363302772535780@newsletter',
                            newsletterName: 'Kirito ♕ — Official Channel ™',
                            serverMessageId: 999999
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.25, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.5844531059265137  },
                                { x: 0.25, y: 0.5844531059265137  }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: instagramShortcode,
                                    songId: instagramShortcode,
                                    author: author,
                                    title: title,
                                    artistAttribution: `https://www.instagram.com/p/${instagramShortcode}/`,
                                    // ✅ Estos 4 campos son los que faltaban para mostrar la imagen
                                    artworkDirectPath: artDirectPath,
                                    artworkMediaKey:   artMediaKey,
                                    artworkSha256:     artSha256,
                                    artworkEncSha256:  artEncSha256,
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
            console.error('[musicview] Error:', error);
        }
    }
};

export default musicViewCommand;