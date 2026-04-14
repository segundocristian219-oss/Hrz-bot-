import axios from 'axios';

const pinterestCommand = {
    name: 'pinterest',
    alias: ['pin'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return conn.reply(m.chat, `\t\t\t *『 PINTEREST SEARCH 』* \n\n> ✎ Ingresa un texto para iniciar la búsqueda...`, m);

        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`${global.url_api}/pin?q=${encodeURIComponent(text)}&apikey=${global.key}`);

            if (!res.success || !res.results || res.results.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron resultados para: *${text}*`, m);
            }

            const maxImages = Math.min(res.results.length, 7);
            const randomPick = res.results[Math.floor(Math.random() * maxImages)];
            const imageUrls = res.results.slice(0, maxImages).map(r => r.url);

            const caption = `\t\t*── 「 PINTEREST ALBUM 」 ──*\n\n` +
                             `▢ *BÚSQUEDA:* ${text}\n` +
                             `▢ *TÍTULO:* ${randomPick.title || 'Sin título'}\n` +
                             `▢ *AUTOR:* ${randomPick.author || 'Desconocido'}\n` +
                             `▢ *CANTIDAD:* ${maxImages}\n\n`;

            await sendAlbum(conn, m.chat, imageUrls, {
                caption: caption,
                quoted: m
            });

            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR PINTEREST]: ${error.message}`);
            conn.reply(m.chat, '> ⚔ Error al conectar con el servidor de búsqueda.', m);
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

export default pinterestCommand;
