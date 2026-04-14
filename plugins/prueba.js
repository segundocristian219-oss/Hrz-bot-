import axios from 'axios';
import { generateWAMessageContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',

    run: async (m, { conn, text }) => {
        // Verificamos si hay un mensaje citado, si no usamos el mensaje actual
        let q = m.quoted ? m.quoted : m;

        // Obtenemos el tipo de archivo (mimetype) del mensaje
        let mime = (q.msg || q).mimetype || '';

        // Solo aceptamos videos
        if (!/video/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video.`, m);
        }

        try {
            m.react('🕒'); // Indicamos que estamos procesando

            // Descargamos el video del mensaje citado
            const media = await q.download();

            // Parseamos título y autor separados por "|"
            // Ejemplo de uso: .musicview Mi Canción | Mi Artista
            const title = text.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text.split('|')[1]?.trim() || "Deylin Tech";

            // URL de la imagen del álbum (portada de la música)
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";

            // Shortcode del post de Instagram que se usará como ID de la canción
            const instagramShortcode = "DXF25DKDZrN";

            // Descargamos la imagen del álbum como buffer (datos en memoria)
            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const albumArtBuffer = Buffer.from(resp.data);

            // ✅ FIX 1: Convertimos la imagen a Base64 para el thumbnail
            // WhatsApp requiere Base64 en el campo jpegThumbnail de relayMessage
            const albumArtBase64 = albumArtBuffer.toString('base64');

            // ✅ FIX 2: El hash SHA256 debe ser un Uint8Array (compatible con el proto de WA)
            // Esto se usa para verificar la integridad de la imagen del álbum
            const artworkSha256 = new Uint8Array(
                crypto.createHash('sha256').update(albumArtBuffer).digest()
            );

            // Generamos el contenido base del mensaje de video usando Baileys
            // Esto sube el video a los servidores de WhatsApp y obtiene la URL encriptada
            const messageContent = await generateWAMessageContent(
                {
                    video: media,
                    mimetype: 'video/mp4',
                    jpegThumbnail: albumArtBuffer // Aquí sí va como Buffer (para la subida)
                },
                { upload: conn.waUploadToServer }
            );

            // Extraemos el objeto videoMessage generado por Baileys
            const videoMsg = messageContent.videoMessage;

            // Enviamos el mensaje usando relayMessage para tener control total del payload
            await conn.relayMessage(m.chat, {
                videoMessage: {
                    // Copiamos todos los campos que Baileys generó (URL, claves de cifrado, etc.)
                    ...videoMsg,

                    // ✅ FIX 1 aplicado: usamos Base64 para el thumbnail visible en el chat
                    jpegThumbnail: albumArtBase64,

                    // ✅ FIX 3: Dimensiones del thumbnail (necesarias para que WhatsApp lo muestre)
                    thumbnailWidth: 480,
                    thumbnailHeight: 480,

                    contextInfo: {
                        forwardingScore: 999,   // Puntaje alto para simular reenvío
                        isForwarded: true,       // Marca el mensaje como reenviado

                        // Información del canal (newsletter) del que simula venir el mensaje
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363302772535780@newsletter', // JID del canal
                            newsletterName: 'Kirito ♕ — Official Channel ™', // Nombre visible
                            // ✅ FIX 2: serverMessageId debe ser un número alto y válido
                            // Un valor muy bajo (como 1) hace que WA no muestre el botón "Ver canal"
                            serverMessageId: 999999
                        }
                    },

                    // Anotaciones: definen el área visual y el contenido musical superpuesto
                    annotations: [
                        {
                            // Vértices del polígono que define el área del reproductor en el video
                            // Estos valores centran el reproductor en la parte media del video
                            polygonVertices: [
                                { x: 0.25, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.5844531059265137  },
                                { x: 0.25, y: 0.5844531059265137  }
                            ],

                            // Si es true, WhatsApp no pide confirmación antes de abrir el contenido
                            shouldSkipConfirmation: true,

                            embeddedContent: {
                                embeddedMusic: {
                                    // ID único de la canción (usamos el shortcode de Instagram)
                                    musicContentMediaId: instagramShortcode,
                                    songId: instagramShortcode,

                                    author: author,  // Nombre del artista
                                    title: title,    // Título de la canción

                                    // URL de atribución (de dónde viene la música)
                                    artistAttribution: `https://www.instagram.com/p/${instagramShortcode}/`,

                                    // ✅ FIX 2 aplicado: hash como Uint8Array
                                    artworkSha256: artworkSha256,
                                    artworkEncSha256: artworkSha256,

                                    isExplicit: false,             // ¿Contenido explícito? No
                                    musicSongStartTimeInMs: 0,     // Empieza desde el segundo 0
                                    derivedContentStartTimeInMs: 0,// El video también desde 0
                                    overlapDurationInMs: 30000     // Duración del overlap: 30 seg
                                }
                            },

                            // Indica que esta anotación tiene una acción interactiva
                            embeddedAction: true
                        }
                    ]
                }
            }, { quoted: m }); // Enviamos como respuesta al mensaje original

            m.react('✅'); // Confirmamos que el envío fue exitoso

        } catch (error) {
            // Si algo falla, mostramos el error en el chat
            m.react('❌');
            conn.reply(m.chat, `> ❌ *Error:* ${error.message}`, m);
            console.error('[musicview] Error:', error); // También lo imprimimos en consola
        }
    }
};