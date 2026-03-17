// ══════════════════════════════════════════════════════════════════
//  SPOTIFY DOWNLOADER — v5.0 FINAL
//
//  ✅ Sin ffmpeg   ✅ Sin yt-dlp   ✅ Sin Chrome
//  ✅ Funciona en Render, VPS compartida, cualquier Node.js
//  ✅ Solo HTTP puro — 100% npm
//
//  INSTALAR UNA SOLA VEZ:
//    npm install spotifydl-core node-fetch
//
//  CREDENCIALES (gratis — 2 minutos):
//    1. Ve a https://developer.spotify.com/dashboard
//    2. Crea una app (nombre cualquiera, redirect: http://localhost)
//    3. Copia el Client ID y Client Secret
//    4. Ponlos en las variables de abajo o en un .env
// ══════════════════════════════════════════════════════════════════

import { Spotify } from 'spotifydl-core';

import fetch   from 'node-fetch';

// ── Credenciales — pon las tuyas aquí o en variables de entorno ────────────
const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID     || 'f28d9e320f584ac59d6b05e3146b193d';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '9ed39f1423a748f0aa17c15a0af341de';

// ── Instancia reutilizable (no crear una por cada descarga) ────────────────
const spotify = new Spotify({
    clientId:     SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
});

// ── Helpers ────────────────────────────────────────────────────────────────
const safeName = (s = '') => s.replace(/[\\/*?:"<>|]/g, '').trim().slice(0, 80);

const isSpotUrl = (s = '') =>
    /open\.spotify\.com\/(intl-[a-z]+\/)?track\/[A-Za-z0-9]+/i.test(s) ||
    /spotify\.link\//i.test(s);

const msToTime = (ms) => {
    if (!ms) return '';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Token anónimo de open.spotify.com (para búsqueda sin cuenta) ──────────
let _anonToken   = null;
let _tokenExpiry = 0;

const getAnonToken = async () => {
    if (_anonToken && Date.now() < _tokenExpiry) return _anonToken;
    try {
        const res  = await fetch(
            'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
            { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' } }
        );
        const data = await res.json();
        if (data?.accessToken) {
            _anonToken   = data.accessToken;
            _tokenExpiry = Date.now() + (data.accessTokenExpirationTimestampMs || 3_600_000) - 60_000;
            return _anonToken;
        }
    } catch {}
    return null;
};

// ── Buscar track por nombre en Spotify ────────────────────────────────────
const searchTrack = async (query) => {
    const token = await getAnonToken();
    if (!token) return null;
    try {
        const res  = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const t    = data?.tracks?.items?.[0];
        if (!t) return null;
        return {
            url:         t.external_urls.spotify,
            title:       t.name,
            artist:      t.artists.map(a => a.name).join(', '),
            album:       t.album.name,
            cover:       t.album.images?.[0]?.url || '',
            releaseDate: t.album.release_date || '',
            duration_ms: t.duration_ms,
            isrc:        t.external_ids?.isrc || '',
        };
    } catch {
        return null;
    }
};

// ── Obtener metadatos de una URL de Spotify ───────────────────────────────
const getTrackMeta = async (spotifyUrl) => {
    const token = await getAnonToken();
    if (!token) return null;
    try {
        const idMatch = spotifyUrl.match(/track\/([A-Za-z0-9]+)/);
        if (!idMatch) return null;
        const res  = await fetch(
            `https://api.spotify.com/v1/tracks/${idMatch[1]}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const t = await res.json();
        return {
            url:         t.external_urls.spotify,
            title:       t.name,
            artist:      t.artists.map(a => a.name).join(', '),
            album:       t.album.name,
            cover:       t.album.images?.[0]?.url || '',
            releaseDate: t.album.release_date || '',
            duration_ms: t.duration_ms,
            isrc:        t.external_ids?.isrc || '',
        };
    } catch {
        return null;
    }
};

// ── Tarjeta de información ─────────────────────────────────────────────────
const buildCard = (meta) => {
    const lines = [
        `╔══════════════════════════╗`,
        `║   🎵  *SPOTIFY DOWNLOAD*  ║`,
        `╚══════════════════════════╝\n`,
    ];
    const add = (icon, label, val) => val && lines.push(`> ${icon} *${label}:* ${val}`);
    add('🎵', 'TÍTULO',   meta.title);
    add('🎤', 'ARTISTA',  meta.artist);
    add('💿', 'ÁLBUM',    meta.album);
    add('⏱️', 'DURACIÓN', meta.duration_ms ? msToTime(meta.duration_ms) : '');
    add('📅', 'FECHA',    meta.releaseDate);
    add('🔖', 'ISRC',     meta.isrc);
    lines.push(`\n> _⏳ Descargando audio..._`);
    return lines.join('\n');
};

// ══════════════════════════════════════════════════════════════════
//  COMANDO
// ══════════════════════════════════════════════════════════════════
const spotifyCommand = {
    name:     'spotify',
    alias:    ['spt', 'sp', 'music'],
    category: 'download',

    run: async (m, { conn, text, usedPrefix, command }) => {

        if (!text) return m.reply(
            `> ✎ *USO:* ${usedPrefix + command} <nombre o URL de Spotify>\n\n` +
            `*Ejemplos:*\n` +
            `• ${usedPrefix + command} Adele Hello\n` +
            `• ${usedPrefix + command} https://open.spotify.com/track/...`
        );

        await m.react('🔍');

        try {
            let meta;

            // ── Paso 1: obtener metadatos ──────────────────────────────────
            if (isSpotUrl(text)) {
                meta = await getTrackMeta(text.trim());
                if (!meta) {
                    // Si falla el token anónimo, usar spotifydl-core directamente
                    meta = { url: text.trim(), title: 'Track de Spotify', artist: '', album: '' };
                }
            } else {
                meta = await searchTrack(text);
                if (!meta) {
                    await m.react('❌');
                    return m.reply(
                        `> ⚔ *Sin resultados para:* _"${text}"_\n` +
                        `Intenta con el enlace directo de Spotify.`
                    );
                }
            }

            await m.react('🕓');

            // ── Paso 2: enviar tarjeta con portada ─────────────────────────
            if (meta.cover) {
                await conn.sendMessage(m.chat,
                    { image: { url: meta.cover }, caption: buildCard(meta) },
                    { quoted: m }
                );
            } else {
                await m.reply(buildCard(meta));
            }

            // ── Paso 3: descargar con spotifydl-core ──────────────────────
            // Devuelve un Buffer directamente — sin archivos temporales
            // Sin ffmpeg, sin binarios, solo HTTP puro con la API de Spotify
            const audioBuffer = await spotify.downloadTrack(meta.url);

            if (!audioBuffer || audioBuffer.length < 8_000) {
                await m.react('❌');
                return conn.sendMessage(m.chat,
                    { text: '> ⚔ *ERROR:* No se pudo descargar el audio. Intenta de nuevo.' },
                    { quoted: m }
                );
            }

            // ── Paso 4: enviar audio ───────────────────────────────────────
            const fileName = safeName(
                `${meta.title}${meta.artist ? ' - ' + meta.artist : ''}`
            );

            await conn.sendMessage(m.chat,
                {
                    audio:    audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: `${fileName}.mp3`,
                },
                { quoted: m }
            );

            await m.react('✅');

        } catch (err) {
            console.error('[SpotiDL v5]', err);
            await m.react('❌');

            // Mensaje de error útil según el tipo de fallo
            const msg = err.message?.includes('clientId')
                ? `> ⚔ *ERROR:* Credenciales de Spotify inválidas.\nRevisa tu CLIENT_ID y CLIENT_SECRET en developer.spotify.com`
                : err.message?.includes('401') || err.message?.includes('auth')
                ? `> ⚔ *ERROR de autenticación:* Verifica tus credenciales de Spotify Developer.`
                : `> ⚔ *ERROR:* ${err.message}`;

            m.reply(msg);
        }
    }
};

export default spotifyCommand;
