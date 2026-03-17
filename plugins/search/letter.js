import fetch from 'node-fetch';

const HEADERS = {
  'User-Agent': 'DeylinLyricsBot/1.0'
};

function normalizeText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function splitArtistSong(text = '') {
  const clean = normalizeText(text);

  const separators = [' - ', ' – ', ' — ', '|', ':'];
  for (const sep of separators) {
    if (clean.includes(sep)) {
      const [artist, ...rest] = clean.split(sep);
      const song = rest.join(sep).trim();
      if (artist.trim() && song) {
        return {
          artist: artist.trim(),
          song: song.trim()
        };
      }
    }
  }

  return {
    artist: null,
    song: clean
  };
}

function formatLyrics(title, artist, lyrics, source) {
  return (
    `*𝄞    LETRA ENCONTRADA*\n\n` +
    `> ▢ *FUENTE:* ${source}\n` +
    `> ▢ *TÍTULO:* ${title || 'Desconocido'}\n` +
    `> ▢ *ARTISTA:* ${artist || 'Desconocido'}\n\n` +
    `${lyrics || 'Letra no disponible.'}`
  );
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...HEADERS,
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      const raw = await res.text();
      throw new Error(`Respuesta no JSON: ${raw.slice(0, 200)}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fromLRCLIB(query, artist, song) {
  const attempts = [];

  if (query) attempts.push(query);
  if (artist && song) {
    attempts.push(`${artist} ${song}`);
    attempts.push(`${song} ${artist}`);
  }
  if (song) attempts.push(song);

  for (const q of [...new Set(attempts.map(normalizeText).filter(Boolean))]) {
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
      const data = await fetchJson(url);

      if (Array.isArray(data) && data.length > 0) {
        const best =
          data.find(x =>
            x?.plainLyrics ||
            x?.syncedLyrics
          ) || data[0];

        const lyrics = best?.plainLyrics || best?.syncedLyrics;
        if (!lyrics) continue;

        return {
          source: 'LRCLIB',
          title: best.trackName || best.name || song || query,
          artist: best.artistName || artist || 'Desconocido',
          lyrics
        };
      }
    } catch {}
  }

  return null;
}


async function fromLyricsOvh(query, artist, song) {
  const tries = [];

  if (artist && song) {
    tries.push({ artist, song });
  }

  
  tries.push({ artist: 'Desconocido', song: query });
  tries.push({ artist: query, song: query });

  for (const item of tries) {
    try {
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(item.artist)}/${encodeURIComponent(item.song)}`;
      const data = await fetchJson(url);

      if (data?.lyrics && typeof data.lyrics === 'string' && data.lyrics.trim()) {
        return {
          source: 'Lyrics.ovh',
          title: song || query,
          artist: artist || 'Desconocido',
          lyrics: data.lyrics.trim()
        };
      }
    } catch {}
  }

  return null;
}


async function fromHappi(query, artist, song) {
  const apiKey = 'hk846-IHQvYTRpBi3CgWdG2lP3A5igDUB5IVJXxK';
  if (!apiKey) return null;

  const attempts = [];
  if (artist && song) attempts.push(`${artist} ${song}`);
  if (query) attempts.push(query);
  if (song) attempts.push(song);

  for (const q of [...new Set(attempts.map(normalizeText).filter(Boolean))]) {
    try {
      const url = `https://api.happi.dev/v1/music?q=${encodeURIComponent(q)}&limit=5&type=track`;
      const data = await fetchJson(url, {
        headers: {
          'x-happi-key': apiKey
        }
      });

      const items = data?.result || data?.results || data?.data || [];
      if (!Array.isArray(items) || !items.length) continue;

      
      const candidate = items.find(x => x?.lyrics || x?.plainLyrics || x?.syncedLyrics) || items[0];

      if (candidate?.lyrics || candidate?.plainLyrics || candidate?.syncedLyrics) {
        return {
          source: 'Happi.dev',
          title: candidate.track || candidate.trackName || song || query,
          artist: candidate.artist || candidate.artistName || artist || 'Desconocido',
          lyrics: candidate.lyrics || candidate.plainLyrics || candidate.syncedLyrics
        };
      }

      const detailUrl =
        candidate?.api_lyrics ||
        candidate?.lyrics_url ||
        candidate?.url ||
        candidate?.api_track;

      if (detailUrl) {
        const detail = await fetchJson(detailUrl, {
          headers: {
            'x-happi-key': apiKey
          }
        });

        const lyrics =
          detail?.result?.lyrics ||
          detail?.lyrics ||
          detail?.plainLyrics ||
          detail?.syncedLyrics;

        if (lyrics) {
          return {
            source: 'Happi.dev',
            title:
              detail?.result?.track ||
              detail?.track ||
              candidate?.track ||
              song ||
              query,
            artist:
              detail?.result?.artist ||
              detail?.artist ||
              candidate?.artist ||
              artist ||
              'Desconocido',
            lyrics
          };
        }
      }
    } catch {}
  }

  return null;
}

const lyricsCommand = {
  name: 'letra',
  alias: ['lyrics', 'lrc'],
  category: 'tools',
  run: async (m, { text, usedPrefix, command }) => {
    if (!text) {
      return m.reply(`> ✎ USO: ${usedPrefix + command} <artista - canción>\n> ✎ Ejemplo: ${usedPrefix + command} Adele - Hello`);
    }

    await m.react('🔍');

    try {
      const query = normalizeText(text);
      const { artist, song } = splitArtistSong(query);

      const providers = [
        () => fromLRCLIB(query, artist, song),
        () => fromLyricsOvh(query, artist, song),
        () => fromHappi(query, artist, song)
      ];

      for (const provider of providers) {
        try {
          const result = await provider();
          if (result?.lyrics) {
            await m.react('✅');
            return m.reply(
              formatLyrics(
                result.title,
                result.artist,
                result.lyrics,
                result.source
              )
            );
          }
        } catch {}
      }

      await m.react('✖️');
      return m.reply(
        '> ⚔ ERROR: No se pudo encontrar la letra en las fuentes configuradas.\n' +
        '> ✎ Fuentes probadas: LRCLIB, Lyrics.ovh' +
        (process.env.HAPPI_API_KEY ? ', Happi.dev' : '')
      );
    } catch (e) {
      await m.react('✖️');
      return m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
    }
  }
};

export default lyricsCommand;