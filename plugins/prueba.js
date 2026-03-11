import axios from 'axios';

const threadsCommand = {
    name: 'threads',
    alias: ['th', 'threadsdl'],
    category: 'descargas',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`Ingresa un enlace.\n\n> Ejemplo: *${usedPrefix + command}* https://www.threads.com/@user/post/ID`);

        const url = args[0].split('?')[0]; // Limpiar parámetros de tracking

        try {
            await m.reply('⏳ Buscando contenido...');

            // Headers realistas para simular un navegador real
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-CH-UA': '"Chromium";v="122", "Not(A:Brand";v="24"',
                'Sec-CH-UA-Mobile': '?0',
                'Sec-CH-UA-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            };

            const { data: html } = await axios.get(url, { headers, timeout: 15000 });

            // ── Estrategia 1: JSON oculto en <script> (método más confiable) ──
            let mediaItems = [];
            let description = '';

            try {
                // Threads guarda los datos en scripts de tipo "application/json" o "__bbox"
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
                    } catch (_) { /* continuar */ }
                }

                // También buscar en scripts normales con __bbox o require
                if (mediaItems.length === 0) {
                    const bboxMatch = html.match(/require\(\["TSPBootstrapper"\][^)]*\)/g) ||
                                     html.match(/"video_versions":\s*(\[[\s\S]*?\])/g) ||
                                     html.match(/"image_versions2":\s*(\{[\s\S]*?\})/g);

                    if (bboxMatch) {
                        for (const m of bboxMatch) {
                            const videoMatch = m.match(/"url":"([^"]+\.mp4[^"]*)"/g);
                            const imageMatch = m.match(/"url":"([^"]+\.jpg[^"]*)"/g) || m.match(/"url":"([^"]+\.webp[^"]*)"/g);
                            
                            if (videoMatch) {
                                mediaItems.push({ type: 'video', url: cleanUrl(videoMatch[0].replace(/"url":"/, '').replace(/"$/, '')) });
                            } else if (imageMatch) {
                                mediaItems.push({ type: 'image', url: cleanUrl(imageMatch[imageMatch.length - 1].replace(/"url":"/, '').replace(/"$/, '')) });
                            }
                        }
                    }
                }
            } catch (_) { /* fallback a og:tags */ }

            // ── Estrategia 2: Open Graph meta tags (fallback) ──
            if (mediaItems.length === 0) {
                // og:video (puede haber múltiples)
                const videoMatches = [...html.matchAll(/<meta[^>]*property="og:video(?::url)?"[^>]*content="([^"]+)"/g)];
                for (const match of videoMatches) {
                    mediaItems.push({ type: 'video', url: cleanUrl(match[1]) });
                }

                // og:image (puede haber múltiples)  
                if (mediaItems.length === 0) {
                    const imageMatches = [...html.matchAll(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/g)];
                    for (const match of imageMatches) {
                        const imgUrl = cleanUrl(match[1]);
                        // Filtrar imágenes genéricas de perfil de Threads
                        if (!imgUrl.includes('instagram.com/static') && !imgUrl.includes('fbcdn.net/rsrc')) {
                            mediaItems.push({ type: 'image', url: imgUrl });
                        }
                    }
                }
            }

            // Descripción del post
            description = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[1] ||
                         html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ||
                         'Threads Content';

            // Decodificar entidades HTML en descripción
            description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

            if (mediaItems.length === 0) {
                return m.reply('❌ No se encontró contenido multimedia. El post puede ser privado, solo texto, o Threads bloqueó el acceso.');
            }

            // ── Descargar y enviar medios ──
            let sent = 0;
            for (const item of mediaItems) {
                try {
                    const res = await axios.get(item.url, { 
                        responseType: 'arraybuffer',
                        headers: { 
                            'Referer': 'https://www.threads.com/',
                            'User-Agent': headers['User-Agent']
                        },
                        timeout: 30000
                    });

                    const buffer = Buffer.from(res.data, 'binary');
                    const caption = sent === 0 ? `> ╰✰ ${description}` : '';

                    await conn.sendMessage(m.chat, {
                        [item.type]: buffer,
                        caption,
                        mimetype: item.type === 'video' ? 'video/mp4' : 'image/jpeg'
                    }, { quoted: m });

                    sent++;
                    // Pequeña pausa entre múltiples archivos
                    if (mediaItems.length > 1) await sleep(500);
                } catch (dlErr) {
                    console.error(`Error descargando ${item.type}:`, dlErr.message);
                }
            }

            if (sent === 0) {
                m.reply('❌ Se encontró el contenido pero falló la descarga. Intenta de nuevo.');
            }

        } catch (error) {
            console.error('Threads Error:', error.message);
            if (error.response?.status === 403 || error.response?.status === 429) {
                m.reply('❌ Threads bloqueó la solicitud (rate limit). Espera unos minutos e intenta de nuevo.');
            } else if (error.response?.status === 404) {
                m.reply('❌ Post no encontrado. Verifica que el enlace sea correcto y el post sea público.');
            } else {
                m.reply('❌ Error al conectar con Threads. Verifica que el post sea público.');
            }
        }
    }
};

// ── Utilidades ──

function cleanUrl(url) {
    return url.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\/g, '');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Busca recursivamente URLs de video/imagen dentro de un objeto JSON
 * (Threads esconde los datos en estructuras anidadas profundas)
 */
function extractMediaFromJson(obj, results = [], depth = 0) {
    if (depth > 15 || !obj || typeof obj !== 'object') return results;

    // Detectar video_versions (array de calidades)
    if (Array.isArray(obj.video_versions)) {
        const best = obj.video_versions[0]; // Primera = mejor calidad
        if (best?.url) results.push({ type: 'video', url: cleanUrl(best.url) });
    }

    // Detectar image_versions2
    if (obj.image_versions2?.candidates?.length) {
        const best = obj.image_versions2.candidates[0];
        if (best?.url) results.push({ type: 'image', url: cleanUrl(best.url) });
    }

    // Carousel / múltiples medios
    if (Array.isArray(obj.carousel_media)) {
        for (const item of obj.carousel_media) {
            extractMediaFromJson(item, results, depth + 1);
        }
    }

    // Recursión en valores del objeto
    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
            extractMediaFromJson(val, results, depth + 1);
        }
    }

    return results;
}

export default threadsCommand;
