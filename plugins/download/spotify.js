import fetch from 'node-fetch';

// ═══════════════════════════════════════════════════════════════
//  SPOTIFY DOWNLOADER COMMAND
//  Fuentes de descarga (fallback automático):
//    1. api.spotifydown.com  — API pública, más confiable
//    2. api.delirius.store   — Para búsqueda por nombre
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 20_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

const fetchJSON = async (url, opts = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal, ...opts });
        const text = await res.text();
        return JSON.parse(text);
    } finally {
        clearTimeout(timer);
    }
};

const msToTime = (ms) => {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const extractSpotifyId = (url) => {
    const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(?:track|episode)\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
};

// ── Fuente 1: spotifydown.com (API pública sin auth) ─────────────────────────

const getMetaSpotifydown = async (trackId) => {
    try {
        const data = await fetchJSON(
            `https://api.spotifydown.com/metadata/track/${trackId}`,
            { headers: { Origin: 'https://spotifydown.com', Referer: 'https://spotifydown.com/' } }
        );
        if (data?.success) return data;
    } catch (_) {}
    return null;
};

const getDownloadSpotifydown = async (trackId) => {
    try {
        const data = await fetchJSON(
            `https://api.spotifydown.com/download/${trackId}`,
            { headers: { Origin: 'https://spotifydown.com', Referer: 'https://spotifydown.com/' } }
        );
        if (data?.success && data?.link) return data.link;
    } catch (_) {}
    return null;
};

// ── Fuente 2: api.delirius.store ──────────────────────────────────────────────

const getDownloadDelirius = async (spotifyUrl) => {
    try {
        const data = await fetchJSON(
            `https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(spotifyUrl)}`
        );
        if (data?.status && data?.data?.download) return data.data.download;
    } catch (_) {}
    return null;
};

const searchDelirius = async (query) => {
    try {
        const data = await fetchJSON(
            `https://api.delirius.store/search/spotify?q=${encodeURIComponent(query)}&limit=1`
        );
        if (data?.status && data?.data?.length) return data.data[0];
    } catch (_) {}
    return null;
};

// ── Fuente 3: Otro endpoint alternativo de descarga ───────────────────────────

const getDownloadAlternative = async (trackId) => {
    // Intenta spotifymate como último recurso
    try {
        const res = await fetch('https://spotifymate.com/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Origin: 'https://spotifymate.com',
                Referer: 'https://spotifymate.com/',
            },
            body: `url=https://open.spotify.com/track/${trackId}`,
        });
        const data = await res.json();
        return data?.link || data?.url || data?.download || null;
    } catch (_) {}
    return null;
};

// ── Orquestador: obtiene enlace de descarga probando todas las fuentes ────────

const resolveDownloadUrl = async (trackId, spotifyUrl) => {
    // Intenta las fuentes en paralelo — usa la primera que responda
    const results = await Promise.allSettled([
        getDownloadSpotifydown(trackId),
        getDownloadDelirius(spotifyUrl),
        getDownloadAlternative(trackId),
    ]);

    for (const r of results) {
        if (r.status === 'fulfilled' && r.value) return r.value;
    }
    return null;
};

// ── Formatear la tarjeta de información ──────────────────────────────────────

const buildInfoCard = (meta) => {
    const lines = [
        `╔══════════════════════════╗`,
        `║   🎵  *SPOTIFY DOWNLOAD*  ║`,
        `╚══════════════════════════╝\n`,
    ];

    if (meta.title)       lines.push(`> 🎵 *TÍTULO:*    ${meta.title}`);
    if (meta.artists)     lines.push(`> 🎤 *ARTISTA:*   ${meta.artists}`);
    if (meta.artist)      lines.push(`> 🎤 *ARTISTA:*   ${meta.artist}`);
    if (meta.album)       lines.push(`> 💿 *ÁLBUM:*     ${meta.album}`);
    if (meta.duration_ms) lines.push(`> ⏱️ *DURACIÓN:*  ${msToTime(meta.duration_ms)}`);
    if (meta.duration)    lines.push(`> ⏱️ *DURACIÓN:*  ${meta.duration}`);
    if (meta.releaseDate) lines.push(`> 📅 *FECHA:*     ${meta.releaseDate}`);
    if (meta.publish)     lines.push(`> 📅 *FECHA:*     ${meta.publish}`);
    if (meta.isrc)        lines.push(`> 🔖 *ISRC:*      ${meta.isrc}`);

    lines.push(`\n> _⏳ Descargando audio, espera..._`);
    return lines.join('\n');
};

// ── COMANDO PRINCIPAL ─────────────────────────────────────────────────────────

const spotifyCommand = {
    name: 'spotify',
    alias: ['spt', 'sp', 'music'],
    category: 'download',

    run: async (m, { conn, text, usedPrefix, command }) => {

        // ─── Validar entrada ────────────────────────────────────────────────
        if (!text) {
            return m.reply(
                `> ✎ *USO:* ${usedPrefix + command} <nombre de canción o URL de Spotify>\n\n` +
                `*Ejemplos:*\n` +
                `• ${usedPrefix + command} Shape of You\n` +
                `• ${usedPrefix + command} https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3`
            );
        }

        await m.react('🔍');

        try {
            const isUrl = /open\.spotify\.com\/(intl-[a-z]+\/)?track\/[A-Za-z0-9]+/i.test(text)
                       || /spotify\.link\//i.test(text);

            let spotifyUrl, trackId, meta;

            // ─── Rama A: URL directa ────────────────────────────────────────
            if (isUrl) {
                spotifyUrl = text.trim();
                trackId    = extractSpotifyId(spotifyUrl);

                if (!trackId) {
                    await m.react('❌');
                    return m.reply('> ⚔ *ERROR:* No se pudo extraer el ID del track. Verifica el enlace.');
                }

                // Obtener metadatos desde spotifydown
                const raw = await getMetaSpotifydown(trackId);
                meta = raw || { title: 'Track de Spotify', artists: '', spotifyUrl };

            // ─── Rama B: Búsqueda por nombre ────────────────────────────────
            } else {
                await m.react('🕓');

                const searchResult = await searchDelirius(text);

                if (!searchResult) {
                    await m.react('❌');
                    return m.reply(`> ⚔ *ERROR:* No se encontraron resultados para *"${text}"*.\nIntenta con el enlace directo de Spotify.`);
                }

                spotifyUrl = searchResult.url;
                trackId    = extractSpotifyId(spotifyUrl) || searchResult.id;
                meta       = searchResult;

                // Enriquecer con spotifydown si tenemos el ID
                if (trackId) {
                    const enriched = await getMetaSpotifydown(trackId);
                    if (enriched?.success) meta = { ...meta, ...enriched };
                }
            }

            // ─── Enviar imagen con info antes de descargar ──────────────────
            const coverUrl = meta.cover || meta.image || meta.artwork || null;

            const infoText = buildInfoCard(meta);

            if (coverUrl) {
                await conn.sendMessage(
                    m.chat,
                    { image: { url: coverUrl }, caption: infoText },
                    { quoted: m }
                );
            } else {
                await m.reply(infoText);
            }

            // ─── Obtener URL de descarga (todas las fuentes en paralelo) ────
            const downloadUrl = await resolveDownloadUrl(trackId, spotifyUrl);

            if (!downloadUrl) {
                await m.react('❌');
                return conn.sendMessage(
                    m.chat,
                    { text: '> ⚔ *ERROR:* Todas las fuentes fallaron al obtener el audio.\nIntenta de nuevo en unos minutos.' },
                    { quoted: m }
                );
            }

            // ─── Enviar audio ───────────────────────────────────────────────
            const title   = meta.title  || 'Audio';
            const artist  = meta.artists || meta.artist || '';
            const fileName = `${title}${artist ? ' - ' + artist : ''}.mp3`
                              .replace(/[\\/*?:"<>|]/g, '');

            await conn.sendMessage(
                m.chat,
                {
                    audio:    { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName,
                    // ptt: false  ←  true si quieres que aparezca como nota de voz
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
