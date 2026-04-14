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
            const author = text.split('|')[1]?.trim() || "Deylin Tech";
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";
            const instagramShortcode = "DXF25DKDZrN"; 

            // Descarga y procesamiento del buffer
            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const albumArtBuffer = Buffer.from(resp.data);
            
            // Hash necesario para los metadatos de música
            const artworkSha256 = crypto.createHash('sha256').update(albumArtBuffer).digest();

            const messageContent = await generateWAMessageContent(
                { 
                    video: media, 
                    mimetype: 'video/mp4',
                    // Importante: JPEG thumbnail debe estar presente aquí también
                    jpegThumbnail: albumArtBuffer 
                },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: albumArtBuffer, // Asegúrate que sea un Buffer
                    viewOnce: false, // Cambiar a true si quieres que desaparezca
                    contextInfo: {
                        forwardingScore: 999, // Score alto para forzar el layout de canal
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
                                { x: 0.2, y: 0.2 }, // Ajuste de vértices un poco más amplio
                                { x: 0.8, y: 0.2 },
                                { x: 0.8, y: 0.8 },
                                { x: 0.2, y: 0.8 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: instagramShortcode,
                                    songId: instagramShortcode,
                                    author: author,
                                    title: title,
                                    artistAttribution: `https://www.instagram.com/p/${instagramShortcode}/`,
                                    artworkSha256: artworkSha256, // Hash de la imagen
                                    // WhatsApp a veces ignora esto si no hay un link real de mediaId
                                    // Pero el hash es vital para que intente renderizar la miniatura
                                    isExplicit: false,
                                    musicSongStartTimeInMs: 0
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
            console.error(error);
            conn.reply(m.chat, `> ❌ *Error:* ${error.message}`, m);
        }
    }
};

export default musicViewCommand;
