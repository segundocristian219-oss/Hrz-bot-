import axios from 'axios';

const threadsCommand = {
    name: 'threads',
    alias: ['th', 'threadsdl'],
    category: 'descargas',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`Ingresa un enlace.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.com/@user/post/ID`);

        const url = args[0].split('?')[0];

        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            };

            const { data: html } = await axios.get(url, { headers, timeout: 15000 });

            let mediaItems = [];
            let description = '';

            const jsonMatches = html.match(/<script[^>]*type="application\/json"[^>]*>(\{[\s\S]*?\})<\/script>/g) || [];
            for (const scriptTag of jsonMatches) {
                const jsonStr = scriptTag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
                try {
                    const parsed = JSON.parse(jsonStr);
                    const found = extractMediaFromJson(parsed);
                    if (found.length > 0) {
                        mediaItems = found;
                        break;
                    }
                } catch (_) {}
            }

            if (mediaItems.length === 0) {
                const bboxMatch = html.match(/require\(\["TSPBootstrapper"\][^)]*\)/g) ||
                                 html.match(/"video_versions":\s*(\[[\s\S]*?\])/g) ||
                                 html.match(/"image_versions2":\s*(\{[\s\S]*?\})/g);

                if (bboxMatch) {
                    for (const sm of bboxMatch) {
                        const videoMatch = sm.match(/"url":"([^"]+\.mp4[^"]*)"/);
                        const imageMatch = sm.match(/"url":"([^"]+\.jpg[^"]*)"/) || sm.match(/"url":"([^"]+\.webp[^"]*)"/);
                        
                        if (videoMatch) {
                            mediaItems.push({ type: 'video', url: cleanUrl(videoMatch[1]) });
                        } else if (imageMatch) {
                            mediaItems.push({ type: 'image', url: cleanUrl(imageMatch[1]) });
                        }
                    }
                }
            }

            if (mediaItems.length === 0) {
                const videoMatches = [...html.matchAll(/<meta[^>]*property="og:video(?::url)?"[^>]*content="([^"]+)"/g)];
                for (const match of videoMatches) {
                    mediaItems.push({ type: 'video', url: cleanUrl(match[1]) });
                }
                const imageMatches = [...html.matchAll(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/g)];
                for (const match of imageMatches) {
                    const imgUrl = cleanUrl(match[1]);
                    if (!imgUrl.includes('instagram.com/static') && !imgUrl.includes('fbcdn.net/rsrc')) {
                        mediaItems.push({ type: 'image', url: imgUrl });
                    }
                }
            }

            description = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] ||
                         html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ||
                         'Threads Content';

            description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

            if (mediaItems.length === 0) return m.reply('❌ No se encontró contenido multimedia.');

            const uniqueMedia = Array.from(new Set(mediaItems.map(a => a.url)))
                .map(url => mediaItems.find(a => a.url === url));

            const medias = uniqueMedia.map(item => ({
                type: item.type,
                data: { url: item.url }
            }));

            const caption = `\t\t*── 「 THREADS DOWNLOAD 」 ──*\n\n` +
                             `▢ *POST:* ${url}\n` +
                             `▢ *INFO:* ${description}\n` +
                             `▢ *CANTIDAD:* ${medias.length}\n\n`;

            if (medias.length > 1) {
                await sendAlbum(conn, m.chat, medias, { caption, quoted: m, delay: 500 });
            } else {
                const item = medias[0];
                await conn.sendMessage(m.chat, {
                    [item.type]: { url: item.data.url },
                    caption,
                    mimetype: item.type === 'video' ? 'video/mp4' : 'image/jpeg'
                }, { quoted: m });
            }

        } catch (error) {
            console.error('Threads Error:', error.message);
            m.reply("❌ Error al conectar con Threads.");
        }
    }
};

async function sendAlbum(conn, jid, medias, options = {}) {
    const album = await conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: medias.filter(m => m.type === "image").length,
            expectedVideoCount: medias.filter(m => m.type === "video").length,
            ...(options.quoted ? {
                contextInfo: {
                    remoteJid: options.quoted.key.remoteJid,
                    fromMe: options.quoted.key.fromMe,
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const msg = await conn.generateWAMessage(album.key.remoteJid, {
            [type]: { url: data.url },
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };
        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
        if (options.delay) await new Promise(r => setTimeout(r, options.delay));
    }
}

function cleanUrl(url) {
    return url.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\/g, '');
}

function extractMediaFromJson(obj, results = [], depth = 0) {
    if (depth > 15 || !obj || typeof obj !== 'object') return results;
    if (Array.isArray(obj.video_versions)) {
        const best = obj.video_versions[0];
        if (best?.url) results.push({ type: 'video', url: cleanUrl(best.url) });
    }
    if (obj.image_versions2?.candidates?.length) {
        const best = obj.image_versions2.candidates[0];
        if (best?.url) results.push({ type: 'image', url: cleanUrl(best.url) });
    }
    if (Array.isArray(obj.carousel_media)) {
        for (const item of obj.carousel_media) {
            extractMediaFromJson(item, results, depth + 1);
        }
    }
    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
            extractMediaFromJson(val, results, depth + 1);
        }
    }
    return results;
}

export default threadsCommand;
