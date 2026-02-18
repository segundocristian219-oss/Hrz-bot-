import fetch from 'node-fetch'
import { promises as fs } from 'fs'

const FILE_PATH = './lib/characters.json'

async function loadCharacters() {
  try {
    await fs.access(FILE_PATH)
  } catch {
    await fs.writeFile(FILE_PATH, '{}')
  }
  return JSON.parse(await fs.readFile(FILE_PATH, 'utf-8'))
}

function flattenCharacters(db) {
  return Object.values(db).flatMap(s =>
    Array.isArray(s.characters) ? s.characters : []
  )
}

function getSeriesNameByCharacter(db, id) {
  return Object.entries(db).find(([, serie]) =>
    Array.isArray(serie.characters) &&
    serie.characters.some(c => String(c.id) === String(id))
  )?.[1]?.name || 'Desconocido'
}

function formatTag(tag) {
  return String(tag).trim().toLowerCase().replace(/\s+/g, '_')
}

async function buscarImagenDelirius(tag) {
  const query = formatTag(tag)

  const urls = [
    `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${query}`,
    `https://danbooru.donmai.us/posts.json?tags=${query}`,
    `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${query}&api_key=f965be362e70972902e69652a472b8b2df2c5d876cee2dc9aebc7d5935d128db98e9f30ea4f1a7d497e762f8a82f132da65bc4e56b6add0f6283eb9b16974a1a&user_id=1862243`
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      })

      const type = res.headers.get('content-type') || ''
      if (!res.ok || !type.includes('json')) continue

      const json = await res.json()
      const data = Array.isArray(json)
        ? json
        : json?.post || json?.data || []

      const images = data
        .map(i =>
          i?.file_url ||
          i?.large_file_url ||
          i?.image ||
          i?.media_asset?.variants?.[0]?.url
        )
        .filter(u =>
          typeof u === 'string' &&
          /^https?:\/\//i.test(u)
        )

      if (images.length) return images
    } catch {}
  }

  return []
}

const wimageCommand = {
  name: 'wimage',
  alias: ['cimage', 'charimage', 'waifuimage'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat }) => {
    try {
      if (m.isGroup && (!chat || !chat.gacha)) {
        return m.reply(
          `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\n` +
          `Un *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`
        )
      }

      if (!args.length) {
        return m.reply(
          `❀ Por favor, indica un personaje.\n` +
          `> Ejemplo » *${usedPrefix + command} Marin Kitagawa*`
        )
      }

      const db = await loadCharacters()
      const characters = flattenCharacters(db)

      const query = args.join(' ').toLowerCase().trim()

      const character =
        characters.find(c => c.name?.toLowerCase() === query) ||
        characters.find(c =>
          c.name?.toLowerCase().includes(query) ||
          c.tags?.some(t => t.toLowerCase().includes(query))
        ) ||
        characters.find(c =>
          query.split(' ').some(w =>
            c.name?.toLowerCase().includes(w) ||
            c.tags?.some(t => t.toLowerCase().includes(w))
          )
        )

      if (!character) {
        return m.reply(`ꕥ No se encontró el personaje *${query}*.`)
      }

      const tag = Array.isArray(character.tags) ? character.tags[0] : character.name
      const images = await buscarImagenDelirius(tag)

      if (!images.length) {
        return m.reply(`ꕥ No se encontraron imágenes para *${character.name}*.`)
      }

      const image = images[Math.floor(Math.random() * images.length)]
      const serie = getSeriesNameByCharacter(db, character.id)

      const caption =
`❀ Nombre » *${character.name}*
⚥ Género » *${character.gender || 'Desconocido'}*
❖ Fuente » *${serie}*`

      await conn.sendMessage(
        m.chat,
        { image: { url: image }, caption },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      await m.reply(`⚠ Error inesperado:\n${e.message}`)
    }
  }
}

export default wimageCommand
