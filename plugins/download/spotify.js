import fetch from 'node-fetch';

// ═══════════════════════════════════════════════════════════════
//  SPOTIFY DOWNLOADER COMMAND  — v2.1
//  Fix: descarga el audio como buffer antes de enviarlo,
//       resuelve el error "Failed to fetch stream from rapid.dlapi.app"
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 30_000;

// ── fetch con timeout ─────────────────────────────────────────────────────────
const fetchWithTimeout = async (url, opts = {}, ms = TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal, ...opts });
    } finally {
        clearTimeout(timer);
    }
};

const fetchJSON = async (url, opts = {}) => {
    const res = await fetchWithTimeout(url, opts);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const msToTime = (ms) => {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const extractSpotifyId = (url) => {
    const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(?:track|episode)\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
};

const safeName = (str) => str.replace(/[\\/*?:"<>|]/g, '').trim();

// ── Descargar audio como Buffer (resuelve el error de stream) ─────────────────
const downloadAudioBuffer = async (audioUrl) => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept': 'audio/mpeg, audio/*, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://spotifydown.com/',
        'Origin': 'https://spotifydown.com',
        'Connection': 'keep-alive',
    };

    const res = await fetchWithTimeout(audioUrl, { headers }, 40_000);

    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar audio`);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
        throw new Error(`Respuesta inesperada del servidor: ${contentType}`);
    }

    const buffer = await res.buffer();
    if (buffer.length < 10_000) throw new Error('Audio demasiado pequeño (posible error del servidor)');

    return buffer;
};

// ── Fuente 1: api.spotifydown.com ─────────────────────────────────────────────
const SPDOWN_HEADERS = {
    Origin: 'https://spotifydown.com',
    Referer: 'https://spotifydown.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
};

const getMetaSpotifydown = async (trackId) => {
    const data = await fetchJSON(
        `https://api.spotifydown.com/metadata/track/${trackId}`,
        { headers: SPDOWN_HEADERS }
    );
    return data?.success ? data : null;
};

const getDownloadLinkSpotifydown = async (trackId) => {
    const data = await fetchJSON(
        `https://api.spotifydown.com/download/${trackId}`,
        { headers: SPDOWN_HEADERS }
    );
    return data?.success && data?.link ? data.link : null;
};

// ── Fuente 2: api.delirius.store ──────────────────────────────────────────────
const getDownloadLinkDelirius = async (spotifyUrl) => {
    const data = await fetchJSON(
        `https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(spotifyUrl)}`
    );
    return data?.status && data?.data?.download ? data.data.download : null;
};

const searchDelirius = async (query) => {
    const data = await fetchJSON(
        `https://api.delirius.store/search/spotify?q=${encodeURIComponent(query)}&limit=1`
    );
    return data?.status && data?.data?.length ? data.data[0] : null;
};

// ── Resolver URL de descarga (fuentes en paralelo) ────────────────────────────
const resolveDownloadUrl = async (trackId, spotifyUrl) => {
    const [r1, r2] = await Promise.allSettled([
        getDownloadLinkSpotifydown(trackId),
        getDownloadLinkDelirius(spotifyUrl),
    ]);
    return (r1.status === 'fulfilled' && r1.value)
        ? r1.value
        : (r2.status === 'fulfilled' && r2.value)
            ? r2.value
            : null;
};

// ── Tarjeta de información ────────────────────────────────────────────────────
const buildCard = (meta) => {
    const lines = [
        `╔══════════════════════════╗`,
        `║   🎵  *SPOTIFY DOWNLOAD*  ║`,
        `╚══════════════════════════╝\n`,
    ];
    const add = (icon, label, val) => val && lines.push(`> ${icon} *${label}:* ${val}`);

    add('🎵', 'TÍTULO',   meta.title);
    add('🎤', 'ARTISTA',  meta.artists || meta.artist);
    add('💿', 'ÁLBUM',    meta.album);
    add('⏱️', 'DURACIÓN', meta.duration_ms ? msToTime(meta.duration_ms) : meta.duration);
    add('📅', 'FECHA',    meta.releaseDate || meta.publish);
    add('🔖', 'ISRC',     meta.isrc);

    lines.push(`\n> _⏳ Descargando audio, espera..._`);
    return lines.join('\n');
};

// ═══════════════════════════════════════════════════════════════
//  COMANDO
// ═══════════════════════════════════════════════════════════════
const spotifyCommand = {
    name: 'spotify',
    alias: ['spt', 'sp', 'music'],
    category: 'download',

    run: async (m, { conn, text, usedPrefix, command }) => {

        if (!text) {
            return m.reply(
                `> ✎ *USO:* ${usedPrefix + command} <nombre o URL de Spotify>\n\n` +
                `*Ejemplos:*\n` +
                `• ${usedPrefix + command} Adele Hello\n` +
                `• ${usedPrefix + command} https://open.spotify.com/track/...`
            );
        }

        await m.react('🔍');

        try {
            const isUrl = /open\.spotify\.com\/(intl-[a-z]+\/)?track\/[A-Za-z0-9]+/i.test(text)
                       || /spotify\.link\//i.test(text);

            let spotifyUrl, trackId, meta;

            // ── URL directa ──────────────────────────────────────────────────
            if (isUrl) {
                spotifyUrl = text.trim();
                trackId    = extractSpotifyId(spotifyUrl);

                if (!trackId) {
                    await m.react('❌');
                    return m.reply('> ⚔ *ERROR:* No se pudo extraer el ID. Verifica el enlace.');
                }

                await m.react('🕓');
                meta = await getMetaSpotifydown(trackId) || { title: 'Track de Spotify' };

            // ── Búsqueda por nombre ──────────────────────────────────────────
            } else {
                await m.react('🕓');

                const searchResult = await searchDelirius(text);
                if (!searchResult) {
                    await m.react('❌');
                    return m.reply(`> ⚔ *ERROR:* Sin resultados para *"${text}"*.\nIntenta con el enlace directo.`);
                }

                spotifyUrl = searchResult.url;
                trackId    = extractSpotifyId(spotifyUrl) || searchResult.id;
                meta       = searchResult;

                // Enriquecer metadatos con spotifydown
                if (trackId) {
                    const enriched = await getMetaSpotifydown(trackId);
                    if (enriched?.success) meta = { ...meta, ...enriched };
                }
            }

            // ── Enviar tarjeta de información ────────────────────────────────
            const coverUrl = meta.cover || meta.image || meta.artwork || null;

            if (coverUrl) {
                await conn.sendMessage(m.chat,
                    { image: { url: coverUrl }, caption: buildCard(meta) },
                    { quoted: m }
                );
            } else {
                await m.reply(buildCard(meta));
            }

            // ── Obtener link de descarga ─────────────────────────────────────
            const downloadUrl = await resolveDownloadUrl(trackId, spotifyUrl);

            if (!downloadUrl) {
                await m.react('❌');
                return conn.sendMessage(m.chat,
                    { text: '> ⚔ *ERROR:* No se pudo obtener enlace de descarga.\nIntenta de nuevo en un momento.' },
                    { quoted: m }
                );
            }

            // ── Descargar como buffer y enviar ───────────────────────────────
            // rapid.dlapi.app requiere descargar el stream con headers específicos.
            // Si lo pasas como URL directa a WhatsApp, falla con "Failed to fetch stream".
            let audioBuffer;
            try {
                audioBuffer = await downloadAudioBuffer(downloadUrl);
            } catch (streamErr) {
                console.error('[SpotiDL] Fallo descarga buffer, intentando URL directa:', streamErr.message);
                // Fallback: intentar pasar la URL directamente
                try {
                    await conn.sendMessage(m.chat,
                        {
                            audio:    { url: downloadUrl },
                            mimetype: 'audio/mpeg',
                            fileName: safeName(`${meta.title || 'audio'}.mp3`),
                        },
                        { quoted: m }
                    );
                    return await m.react('✅');
                } catch {
                    await m.react('❌');
                    return conn.sendMessage(m.chat,
                        { text: `> ⚔ *ERROR al descargar audio:* ${streamErr.message}` },
                        { quoted: m }
                    );
                }
            }

            const title    = meta.title   || 'Audio';
            const artist   = meta.artists || meta.artist || '';
            const fileName = safeName(`${title}${artist ? ' - ' + artist : ''}.mp3`);

            await conn.sendMessage(m.chat,
                {
                    audio:    audioBuffer,   // Buffer — evita el error de stream
                    mimetype: 'audio/mpeg',
                    fileName,
                },
                { quoted: m }
            );

            await m.react('✅');

        } catch (err) {
            console.error('[SpotiDL]', err);
            await m.react('❌');
            m.reply(`> ⚔ *ERROR CRÍTICO:* ${err.message}`);
        }
    }
};

export default spotifyCommand;
