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
            return conn.reply(m.chat, `> ⍰ Responde a un video para enviarlo con estructura de música nativa.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();
            const title = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "VOKER SYSTEM";
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";

            // 1. Descargar carátula para el Buffer
            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const albumArtBuffer = Buffer.from(resp.data);
            const artworkSha = crypto.createHash('sha256').update(albumArtBuffer).digest();

            // 2. Generar el contenido del video (Subida a servidores de WA)
            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            // 3. IDs únicos para evitar conflicto con el catálogo de Meta (Adele)
            const randomId = crypto.randomBytes(8).readBigUInt64BE().toString();

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: albumArtBuffer,
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
                            thumbnail: albumArtBuffer,
                            sourceUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29"
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.25, y: 0.4 },
                                { x: 0.75, y: 0.4 },
                                { x: 0.75, y: 0.6 },
                                { x: 0.25, y: 0.6 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: randomId,
                                    songId: randomId,
                                    author: author,
                                    title: title,
                                    artworkSha256: artworkSha, // CRITICO: Vincula la imagen con la música
                                    artistAttribution: `https://www.instagram.com/_u/${author.replace(/\s/g, '').toLowerCase()}`,
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
            conn.reply(m.chat, `> ❌ *Error:* ${error.message}`, m);
        }
    }
};

export default musicViewCommand;
