import axios from 'axios';

export const investigarCommand = {
    category: 'search',
    commands: {
        investigar: {
            name: 'investigar',
            alias: ['buscar'],
            run: async (m, { conn, text }) => {
                if (!text) return m.reply('Escribe qué quieres investigar.');

                const TAVILY_API_KEY = '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';
                const MAX_IMAGENES = 4;

                try {
                    await m.react('🕒');

                    const { data } = await axios.post('https://api.tavily.com/search', {
                        api_key: TAVILY_API_KEY,
                        query: `Investigación detallada: "${text}". Resumen extenso y estructurado en español.`,
                        search_depth: "basic",
                        include_answer: true,
                        include_images: true,
                        max_results: 5
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!data.answer && (!data.results || data.results.length === 0)) {
                        await m.react('❌');
                        return m.reply("No se encontraron resultados.");
                    }

                    let respuesta = `🧠 *INVESTIGACIÓN DETALLADA*\n\n`;
                    if (data.answer) respuesta += `📝 *RESUMEN:* \n${data.answer}\n\n`;

                    if (data.results && data.results.length > 0) {
                        respuesta += `🌐 *FUENTES:* \n`;
                        data.results.forEach((res, i) => {
                            respuesta += `\n${i + 1}. *${res.title}*\n🔗 ${res.url}\n`;
                        });
                    }

                    const imagenes = data.images && data.images.length > 0 
                        ? data.images.slice(0, MAX_IMAGENES).map(img => typeof img === 'string' ? img : img.url) 
                        : [];

                    if (imagenes.length > 0) {
                        await sendAlbum(conn, m.chat, imagenes, {
                            caption: respuesta.trim(),
                            quoted: m
                        });
                    } else {
                        await conn.sendMessage(m.chat, { text: respuesta.trim() }, { quoted: m });
                    }

                    await m.react('✅');

                } catch (error) {
                    await m.react('❌');
                    m.reply("❌ Error al conectar con el servicio.");
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
