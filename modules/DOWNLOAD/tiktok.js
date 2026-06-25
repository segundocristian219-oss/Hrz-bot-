import axios from 'axios';

export const tiktokDownloadModule = {
    category: 'descargas',
    commands: {
        tiktok: {
            name: 'tiktok',
            alias: ['tt'],
            run: async (m, { conn, args }) => {
                if (!args[0]) return m.reply(`> ⌕ USO: Ingresa un enlace de TikTok`);

                try {
                    await m.react("⏳");

                    const { data: json } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}&apikey=${global.key || ''}`);

                    if (!json.data) {
                        await m.react("❌");
                        return m.reply("> ⚔ Error al procesar el enlace.");
                    }

                    const data = json.data;
                    const formatter = new Intl.NumberFormat('es-ES');

                    const caption = `♫ TIKTOK DOWNLOAD 𝄞\n\n` +
                                    `✰ AUTOR: ${data.author?.nickname || 'Anónimo'}\n` +
                                    `✎ TÍTULO: ${data.title || 'Sin descripción'}\n` +
                                    `⍰ DURACIÓN: ${data.duration || 0}s\n` +
                                    `♪ MÚSICA: ${data.music_info?.title || 'Original'}\n` +
                                    `♛ CREADOR: ${data.music_info?.author || '---'}\n\n` +
                                    `⌬ ESTADÍSTICAS:\n` +
                                    `◈ VISTAS: ${formatter.format(data.play_count || 0)}\n` +
                                    `♡ LIKES: ${formatter.format(data.digg_count || 0)}\n` +
                                    `⌗ COMENTARIOS: ${formatter.format(data.comment_count || 0)}\n` +
                                    `★ COMPARTIDOS: ${formatter.format(data.share_count || 0)}`;

                    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                        await sendAlbum(conn, m.chat, data.images, {
                            caption: caption,
                            quoted: m
                        });
                    } else {
                        await conn.sendMessage(m.chat, { 
                            video: { url: data.play },
                            caption: caption,
                            fileName: `tiktok.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    }

                    await m.react("✅");
                } catch (e) {
                    console.error(e);
                    await m.react("❌");
                    m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
                }
            }
        }
    }
};

async function sendAlbum(conn, jid, urls, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: urls.length,
            ...(options.quoted ? {
                contextInfo: {
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    await Promise.all(urls.map(async (url, i) => {
        const msg = await conn.generateWAMessage(jid, {
            image: { url: url },
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };

        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}
