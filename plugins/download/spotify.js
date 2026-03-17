import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

// ══════════════════════════════════════════════════════════════════════════════
//  SPOTIFY DOWNLOADER — v4.0 (yt-dlp local, sin APIs externas)
//
//  Cómo funciona:
//    1. Busca metadatos del track con la API pública de Spotify (sin auth)
//       o parsea el nombre desde la búsqueda de texto
//    2. Busca el audio en YouTube Music con yt-dlp
//    3. Descarga y convierte a MP3 con ffmpeg (ya incluido en yt-dlp)
//    4. Envía el archivo y lo borra del disco
//
//  Requisitos en el servidor:
//    npm install node-fetch
//    pip install yt-dlp       (o: pip3 install -U yt-dlp)
//    apt install ffmpeg        (o brew install ffmpeg en Mac)
//
//  Para verificar que funciona:
//    yt-dlp --version
//    ffmpeg -version
// ══════════════════════════════════════════════════════════════════════════════

const TMP_DIR    = '/tmp';
const YTDLP_BIN  = 'yt-dlp';          // cambiar si está en otra ruta
const FETCH_OPTS = { timeout: 15_000 };

// ── Helpers ───────────────────────────────────────────────────────────────────

const safeName   = (s = '') => s.replace(/[\\/*?:"<>|]/g, '').trim().slice(0, 80);
const extractId  = (url = '') => {
    const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]+)/i);
    return m ? m[1] : null;
};
const isSpotUrl  = (s = '') =>
    /open\.spotify\.com\/(intl-[a-z]+\/)?track\/[A-Za-z0-9]+/i.test(s) ||
    /spotify\.link\//i.test(s);

const msToTime = (ms) => {
    if (!ms) return '';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Spotify API pública (sin client_id — usa el token anónimo del web player) ─

const getSpotifyToken = async () => {
    // Token anónimo que usa open.spotify.com — no requiere cuenta
    const res  = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' },
        ...FETCH_OPTS,
    });
    const data = await res.json();
    return data?.accessToken || null;
};

const getSpotifyMeta = async (trackId) => {
    try {
        const token = await getSpotifyToken();
        if (!token) return null;

        const res  = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { Authorization: `Bearer ${token}` },
            ...FETCH_OPTS,
        });
        if (!res.ok) return null;
        const t = await res.json();

        return {
            title:       t.name,
            artist:      t.artists?.map(a => a.name).join(', ') || '',
            album:       t.album?.name || '',
            releaseDate: t.album?.release_date || '',
            duration_ms: t.duration_ms,
            cover:       t.album?.images?.[0]?.url || '',
            isrc:        t.external_ids?.isrc || '',
            spotifyUrl:  t.external_urls?.spotify || `https://open.spotify.com/track/${trackId}`,
        };
    } catch {
        return null;
    }
};

// ── Buscar track en Spotify por nombre (web scrape simple) ────────────────────

const searchSpotifyWeb = async (query) => {
    try {
        const token = await getSpotifyToken();
        if (!token) return null;

        const res  = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            { headers: { Authorization: `Bearer ${token}` }, ...FETCH_OPTS }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const t    = data?.tracks?.items?.[0];
        if (!t) return null;

        return {
            title:       t.name,
            artist:      t.artists?.map(a => a.name).join(', ') || '',
            album:       t.album?.name || '',
            releaseDate: t.album?.release_date || '',
            duration_ms: t.duration_ms,
            cover:       t.album?.images?.[0]?.url || '',
            isrc:        t.external_ids?.isrc || '',
            spotifyUrl:  t.external_urls?.spotify || '',
        };
    } catch {
        return null;
    }
};

// ── Descargar con yt-dlp (busca en YouTube Music por título + artista) ────────

const downloadWithYtdlp = async (title, artist) => {
    const query    = `${title} ${artist}`.trim();
    const safeFile = safeName(`${title} - ${artist}`);
    const outPath  = join(TMP_DIR, `${safeFile}_%(id)s.%(ext)s`);
    const finalMp3 = join(TMP_DIR, `${safeFile}.mp3`);

    // Comando yt-dlp:
    //   - Busca en YouTube Music (ytmsearch:) — mejor coincidencia para canciones
    //   - Extrae solo audio, convierte a MP3 128k con ffmpeg
    //   - Sin miniaturas ni metadatos adicionales para mayor velocidad
    const cmd = [
        YTDLP_BIN,
        `"ytmsearch1:${query.replace(/"/g, "'")}"`,   // 1 resultado de YT Music
        '--extract-audio',
        '--audio-format mp3',
        '--audio-quality 0',           // mejor calidad disponible
        '--no-playlist',
        '--no-warnings',
        '--quiet',
        '--no-progress',
        `--output "${outPath}"`,
        '--max-filesize 50m',          // evitar descargas enormes accidentales
    ].join(' ');

    await execAsync(cmd, { timeout: 120_000 });   // 2 min máximo

    // yt-dlp nombra el archivo con el ID de YouTube; buscarlo en /tmp
    const { stdout } = await execAsync(`ls "${TMP_DIR}" | grep "${safeFile}"`);
    const fileName   = stdout.trim().split('\n')[0];
    if (!fileName) throw new Error('No se encontró el archivo descargado');

    return join(TMP_DIR, fileName);
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
    add('🎤', 'ARTISTA',  meta.artist || meta.artists);
    add('💿', 'ÁLBUM',    meta.album);
    add('⏱️', 'DURACIÓN', meta.duration_ms ? msToTime(meta.duration_ms) : meta.duration);
    add('📅', 'FECHA',    meta.releaseDate || meta.publish);
    add('🔖', 'ISRC',     meta.isrc);
    lines.push(`\n> _⏳ Buscando y descargando audio..._`);
    return lines.join('\n');
};

// ══════════════════════════════════════════════════════════════════════════════
//  COMANDO PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

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

        let meta = null;
        let audioPath = null;

        try {
            // ── Paso 1: obtener metadatos ────────────────────────────────────
            if (isSpotUrl(text)) {
                const id = extractId(text);
                if (!id) {
                    await m.react('❌');
                    return m.reply('> ⚔ *ERROR:* No se pudo extraer el ID del enlace de Spotify.');
                }
                meta = await getSpotifyMeta(id);
                if (!meta) {
                    // Fallback mínimo si la API falla
                    meta = { title: 'Track de Spotify', artist: '', spotifyUrl: text };
                }
            } else {
                // Búsqueda por nombre — usar Spotify API o simplemente el texto
                meta = await searchSpotifyWeb(text);
                if (!meta) {
                    // Sin API: separar "Artista Título" lo mejor posible
                    const parts = text.split(' ');
                    meta = {
                        title:  text,
                        artist: parts.length > 2 ? parts.slice(0, 2).join(' ') : '',
                    };
                }
            }

            await m.react('🕓');

            // ── Paso 2: enviar tarjeta con portada ───────────────────────────
            const cover = meta.cover || meta.image || null;
            if (cover) {
                await conn.sendMessage(m.chat,
                    { image: { url: cover }, caption: buildCard(meta) },
                    { quoted: m }
                );
            } else {
                await m.reply(buildCard(meta));
            }

            // ── Paso 3: descargar con yt-dlp ─────────────────────────────────
            const title  = meta.title  || text;
            const artist = meta.artist || meta.artists || '';

            audioPath = await downloadWithYtdlp(title, artist);

            // ── Paso 4: leer el archivo y enviar ─────────────────────────────
            const audioBuffer = readFileSync(audioPath);
            const fileName    = safeName(`${title}${artist ? ' - ' + artist : ''}.mp3`);

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
            console.error('[SpotiDL]', err);
            await m.react('❌');
            m.reply(
                `> ⚔ *ERROR:* ${err.message}\n\n` +
                `_Verifica que yt-dlp y ffmpeg estén instalados:_\n` +
                `\`pip install -U yt-dlp\`\n` +
                `\`apt install ffmpeg\``
            );
        } finally {
            // ── Limpiar archivo temporal ─────────────────────────────────────
            if (audioPath && existsSync(audioPath)) {
                try { unlinkSync(audioPath); } catch {}
            }
        }
    }
};

export default spotifyCommand;
