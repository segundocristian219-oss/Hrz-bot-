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

            const media = await q.download().catch(e => { throw new Error('Error al descargar el video original') });
            const title = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "VOKER SYSTEM";
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";

            let albumArtBuffer;
            try {
                const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer', timeout: 10000 });
                albumArtBuffer = Buffer.from(resp.data);
            } catch (e) {
                throw new Error('No se pudo cargar la imagen de la portada (URL caída)');
            }

            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;
            if (!videoMsg) throw new Error('Error al procesar el contenido del video (Baileys)');

            const trackId = Buffer.from(title + author).toString('base64').substring(0, 15);

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: albumArtBuffer,
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
                            sourceUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29",
                            mediaUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29"
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.1, y: 0.1 },
                                { x: 0.9, y: 0.1 },
                                { x: 0.9, y: 0.9 },
                                { x: 0.1, y: 0.9 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: trackId,
                                    songId: trackId,
                                    author: author,
                                    title: title,
                                    artistAttribution: author,
                                    artworkDirectPath: "", 
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
            
            conn.reply(m.chat, `> ❌ *Error en el comando:* ${error.message}`, m);
        }
    }
};

export default musicViewCommand;
