import fetch from 'node-fetch';

const HEADERS = {
  'User-Agent': 'DeylinLyricsBot/2.0'
};

const MIN_SCORE_WITH_ARTIST = 0.72;
const MIN_SCORE_NO_ARTIST = 0.86;

function normalizeText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()[\]{}"'`´.,!¡?¿_/\\#+*~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function removeFeaturing(text = '') {
  return normalizeText(text)
    .replace(/\b(feat|ft|featuring|con)\b.*$/i, '')
    .trim();
}

function tokenize(text = '') {
  return normalizeText(text)
    .split(' ')
    .filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (!a.size || !b.size) return 0;

  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

function containsLoose(a = '', b = '') {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x);
}

function similarityText(a = '', b = '') {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (containsLoose(na, nb)) return 0.92;

  const aTokens = tokenize(na);
  const bTokens = tokenize(nb);
  return jaccard(aTokens, bTokens);
}

function artistSimilarity(foundArtist = '', expectedArtist = '') {
  if (!expectedArtist) return 0.5;

  const fa = removeFeaturing(foundArtist);
  const ea = removeFeaturing(expectedArtist);

  if (!fa || !ea) return 0;
  if (fa === ea) return 1;
  if (containsLoose(fa, ea)) return 0.9;

  return jaccard(tokenize(fa), tokenize(ea));
}

function titleSimilarity(foundTitle = '', expectedTitle = '') {
  return similarityText(foundTitle, expectedTitle);
}

function cleanLyrics(lyrics = '') {
  return String(lyrics)
    .replace(/\r/g, '')
    .replace(/^\[\d{1,2}:\d{2}(?:[.:]\d{1,2})?\]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitArtistSong(raw = '') {
  const text = displayText(raw);

  const separators = [' | ', ' - ', ' – ', ' — ', ' : ', ': '];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const [left, ...rest] = text.split(sep);
      const right = rest.join(sep).trim();
      if (left.trim() && right) {
        return {
          artist: displayText(left),
          song: displayText(right),
          structured: true,
          original: text
        };
      }
    }
  }

  return {
    artist: null,
    song: text,
    structured: false,
    original: text
  };
}

function alternateParses(raw = '') {
  const base = splitArtistSong(raw);
  const list = [base];

  const text = displayText(raw);
  if (!base.structured) {
    const parts = text.split(' ').filter(Boolean);

    if (parts.length >= 4) {
      list.push({
        artist: parts.slice(-2).join(' '),
        song: parts.slice(0, -2).join(' '),
        structured: true,
        original: text
      });

      list.push({
        artist: parts.slice(0, 2).join(' '),
        song: parts.slice(2).join(' '),
        structured: true,
        original: text
      });
    }
  }

  const unique = [];
  const seen = new Set();

  for (const item of list) {
    const key = `${normalizeText(item.artist || '')}__${normalizeText(item.song || '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function formatLyrics(title, artist, lyrics, source, score) {
  return (
    `*走    LETRA ENCONTRADA*\n\n` +
    `> ▢ *FUENTE:* ${source}\n` +
    `> ▢ *TÍTULO:* ${title || 'Desconocido'}\n` +
    `> ▢ *ARTISTA:* ${artist || 'Desconocido'}\n` +
    `> ▢ *COINCIDENCIA:* ${Math.round((score || 0) * 100)}%\n\n` +
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

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      const raw = await res.text();
      throw new Error(`Respuesta no JSON: ${raw.slice(0, 200)}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function scoreCandidate(candidate, expectedSong, expectedArtist) {
  const foundTitle = candidate.trackName || candidate.name || candidate.título || '';
  const foundArtist = candidate.artistName || candidate.artist || candidate.artistas || '';

  const tScore = titleSimilarity(foundTitle, expectedSong);
  const aScore = expectedArtist ? artistSimilarity(foundArtist, expectedArtist) : 0.5;

  const finalScore = expectedArtist
    ? (tScore * 0.68) + (aScore * 0.32)
    : tScore;

  return {
    finalScore,
    tScore,
    aScore,
    foundTitle,
    foundArtist
  };
}

async function fromLRCLIB(song, artist = null) {
  const queries = [];

  if (artist) {
    queries.push(`${artist} ${song}`);
    queries.push(`${song} ${artist}`);
  }
  queries.push(song);

  const uniqueQueries = [...new Set(queries.map(displayText).filter(Boolean))];

  let bestOverall = null;

  for (const q of uniqueQueries) {
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
      const data = await fetchJson(url);

      if (!Array.isArray(data) || !data.length) continue;

      for (const item of data) {
        const lyrics = item?.plainLyrics || item?.syncedLyrics;
        if (!lyrics) continue;

        const scored = scoreCandidate(item, song, artist);

        const min = artist ? MIN_SCORE_WITH_ARTIST : MIN_SCORE_NO_ARTIST;
        if (scored.finalScore < min) continue;

        const current = {
          source: 'LRCLIB',
          title: item.trackName || song,
          artist: item.artistName || artist || 'Desconocido',
          lyrics: cleanLyrics(lyrics),
          score: scored.finalScore
        };

        if (!bestOverall || current.score > bestOverall.score) {
          bestOverall = current;
        }
      }
    } catch {}
  }

  return bestOverall;
}

async function fromDelirius(rawText) {
  try {
    const url = `https://api.delirius.store/search/lyrics?q=${encodeURIComponent(rawText)}`;
    const data = await fetchJson(url);

    if (!data?.status || !data?.data?.letra) return null;

    const result = data.data;
    return {
      source: 'Delirius API',
      title: result.título || 'Desconocido',
      artist: result.artistas || 'Desconocido',
      lyrics: cleanLyrics(result.letra),
      score: 0.90
    };
  } catch {
    return null;
  }
}

async function fromLyricsOvh(song, artist = null) {
  if (!artist || !song) return null;

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
    const data = await fetchJson(url);

    if (!data?.lyrics || typeof data.lyrics !== 'string') return null;

    const lyrics = cleanLyrics(data.lyrics);
    if (!lyrics) return null;

    return {
      source: 'Lyrics.ovh',
      title: song,
      artist,
      lyrics,
      score: 0.78
    };
  } catch {
    return null;
  }
}

async function searchReliableLyrics(rawText) {
  const parses = alternateParses(rawText);
  let best = null;

  for (const parsed of parses) {
    const { artist, song, structured } = parsed;

    const providers = [
      () => fromLRCLIB(song, artist),
      () => fromDelirius(rawText),
      () => structured ? fromLyricsOvh(song, artist) : null
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (!result?.lyrics) continue;

        if (!best || result.score > best.score) {
          best = result;
        }
        if (best && best.score >= 0.95) break;
      } catch {}
    }
    if (best && best.score >= 0.95) break;
  }

  return best;
}

const lyricsCommand = {
  name: 'letra',
  alias: ['lyrics', 'lrc'],
  category: 'tools',
  run: async (m, { text, usedPrefix, command }) => {
    if (!text) {
      return m.reply(
        `> ✎ USO: ${usedPrefix + command} <artista - canción>\n` +
        `> ✎ Ejemplo: ${usedPrefix + command} Adele - Hello`
      );
    }

    await m.react('🔍');

    try {
      const result = await searchReliableLyrics(text);

      if (!result) {
        await m.react('✖️');
        return m.reply(
          '> ⚔ ERROR: No encontré una coincidencia confiable.\n' +
          '> ✎ Usa el formato: artista - canción\n' +
          '> ✎ Ejemplo: .letra Adele - Hello'
        );
      }

      await m.react('✅');
      return m.reply(
        formatLyrics(
          result.title,
          result.artist,
          result.lyrics,
          result.source,
          result.score
        )
      );
    } catch (e) {
      await m.react('✖️');
      return m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
    }
  }
};

export default lyricsCommand;
