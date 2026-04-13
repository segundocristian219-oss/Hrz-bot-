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

        // Verificamos que el mensaje al que se responde sea un video
        if (!/video/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video.`, m);
        }

        try {
            m.react('🕒');

            // Descargamos el video del mensaje citado
            const media = await q.download();

            // Obtenemos título y autor del texto (formato: titulo|autor)
            // Si no se proporciona, usamos valores por defecto personalizables
            const title = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "VOKER SYSTEM";

            // URL de la imagen de portada (puedes cambiarla por la que quieras)
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";

            // Descargamos la imagen de portada como buffer
            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const albumArtBuffer = Buffer.from(resp.data);
            
            // Calculamos el hash SHA256 de la portada (necesario para embeddedMusic)
            const artworkSha256 = crypto.createHash('sha256').update(albumArtBuffer).digest('base64');

            // Generamos el contenido del mensaje de video (esto sube el video a los servidores de WhatsApp)
            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            // Generamos un trackId aleatorio (esto ayuda a que WhatsApp lo trate como contenido musical)
            const trackId = crypto.randomBytes(16).toString('hex');

            // Enviamos el mensaje con la estructura completa de Music View
            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    // Usamos la portada como thumbnail del video (esto hace que se muestre grande)
                    jpegThumbnail: albumArtBuffer,
                    contextInfo: {
                        // Marcamos como reenviado para mejorar la apariencia
                        forwardingScore: 1,
                        isForwarded: true,
                        // Información de newsletter (opcional, hace que se vea más "oficial")
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363302772535780@newsletter',
                            newsletterName: 'Kirito ♕ — Official Channel ™',
                            serverMessageId: 1
                        },
                        // External Ad Reply para mostrar título y autor encima
                        externalAdReply: {
                            title: title,
                            body: author,
                            mediaType: 2,                    // 2 = video
                            renderLargerThumbnail: true,
                            thumbnail: albumArtBuffer,
                            sourceUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29"
                        }
                    },
                    // Annotations es la parte clave para activar el Music View
                    annotations: [
                        {
                            // Coordenadas del área donde aparece el overlay de la canción (ajustadas para que quede centrado y natural)
                            polygonVertices: [
                                { x: 0.25, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.5844531059265137 },
                                { x: 0.25, y: 0.5844531059265137 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    // IDs personalizados (aleatorios pero en formato que WhatsApp acepta mejor)
                                    musicContentMediaId: trackId,
                                    songId: trackId,
                                    // Título y autor completamente personalizados
                                    author: author,
                                    title: title,
                                    artistAttribution: author,
                                    // Hashes de la portada (importante para que reconozca la imagen)
                                    artworkSha256: artworkSha256,
                                    artworkEncSha256: artworkSha256,
                                    // Otras configuraciones para que se comporte como música real
                                    isExplicit: false,
                                    musicSongStartTimeInMs: 0,
                                    derivedContentStartTimeInMs: 0,
                                    overlapDurationInMs: 30000   // 30 segundos de overlay de música
                                }
                            },
                            embeddedAction: true
                        }
                    ]
                }
            }, { quoted: m });

            // Reacción de éxito
            m.react('✅');

        } catch (error) {
            // Manejo de errores
            m.react('❌');
            conn.reply(m.chat, `> ❌ *Error:* ${error.message}`, m);
        }
    }
};

export default musicViewCommand;