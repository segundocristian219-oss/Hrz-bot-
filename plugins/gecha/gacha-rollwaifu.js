import fetch from "node-fetch"
import { promises as fs } from "fs"
import path from "path"

const charactersFilePath = "./lib/characters.json"

function encodeId(id) {
  return String(id)
    .split("")
    .map(d => {
      const map = {
        "0": "\u200B", "1": "\u200C", "2": "\u200D", "3": "\u2060",
        "4": "\u2061", "5": "\u2062", "6": "\u2063", "7": "\u2064",
        "8": "\u2065", "9": "\u2066"
      }
      return map[d] || d
    })
    .join("")
}

async function loadCharacters() {
  try {
    await fs.access(charactersFilePath)
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch {
    await fs.writeFile(charactersFilePath, "{}")
    return {}
  }
}

function flattenCharacters(data) {
  return Object.values(data).flatMap(series =>
    Array.isArray(series.characters) ? series.characters : []
  )
}

function getSeriesNameByCharacter(data, charId) {
  return (
    Object.entries(data).find(([_, serie]) =>
      Array.isArray(serie.characters) &&
      serie.characters.some(ch => String(ch.id) === String(charId))
    )?.[1]?.name || "Desconocido"
  )
}

function formatTag(tag) {
  return String(tag || "").toLowerCase().trim().replace(/\s+/g, "_")
}

async function buscarImagenGelbooru(query) {
  const tag = formatTag(query)
  const url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}&limit=20&api_key=f965be362e70972902e69652a472b8b2df2c5d876cee2dc9aebc7d5935d128db98e9f30ea4f1a7d497e762f8a82f132da65bc4e56b6add0f6283eb9b16974a1a&user_id=1862243`

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
    if (!res.ok) return []
    const json = await res.json()
    const posts = json?.post || []
    
    return posts
      .map(p => p?.file_url)
      .filter(u => typeof u === "string" && /\.(jpe?g|png)$/i.test(u))
  } catch {
    return []
  }
}

const rollCommand = {
  name: 'roll',
  alias: ['rw', 'rollwaifu'],
  category: 'gacha',
  run: async (m, { conn, usedPrefix, command, chat }) => {
    try {
      if (!chat.gacha && m.isGroup) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados.\n\nActívalos con: *${usedPrefix}gacha on*`)
      }

      global.db.data.groupGacha ||= {}
      const group = global.db.data.groupGacha[m.chat] ||= {
        users: {},
        characters: {},
        activeRolls: []
      }

      const groupUser = group.users[m.sender] ||= {}
      const now = Date.now()
      const cooldown = 15 * 60 * 1000

      if (groupUser.lastRoll && now < groupUser.lastRoll) {
        const remaining = Math.ceil((groupUser.lastRoll - now) / 1000)
        const min = Math.floor(remaining / 60)
        const sec = remaining % 60
       // return m.reply(`❖ Espera *${min}m ${sec}s* para usar *${usedPrefix + command}*.`)
      }

      const allData = await loadCharacters()
      const characters = flattenCharacters(allData)
      if (!characters.length) return m.reply("⚠︎ Sin personajes disponibles.")

      const character = characters[Math.floor(Math.random() * characters.length)]
      const charId = String(character.id)
      const serie = getSeriesNameByCharacter(allData, charId)

      let images = []
      if (Array.isArray(character.tags) && character.tags.length) {
        for (const t of character.tags) {
          images = await buscarImagenGelbooru(t)
          if (images.length) break
        }
      }
      if (!images.length) images = await buscarImagenGelbooru(character.name)

      if (!images.length) return m.reply(`❖ No se hallaron imágenes para *${character.name}*.`)

      const image = images[Math.floor(Math.random() * images.length)]
      let estado = "Libre"
      const charData = group.characters[charId]

      if (charData && charData.user) {
        const name = global.db.data.users?.[charData.user]?.name || charData.user.split("@")[0]
        estado = `Reclamado por ${name}`
      }

      const rollData = {
        id: charId,
        name: character.name || "Sin nombre",
        value: Number(character.value) || 100,
        gender: character.gender || "Desconocido",
        serie,
        reservedBy: m.sender,
        reservedUntil: now + 30000,
        createdAt: now,
        expiresAt: now + 60000,
        image
      }

      group.activeRolls.push(rollData)
      group.characters[charId] ||= rollData
      groupUser.lastRoll = now + cooldown

      const text =
        `❀ Nombre » *${rollData.name}*${encodeId(charId)}\n` +
        `⚥ Género » *${rollData.gender}*\n` +
        `✰ Valor » *${rollData.value.toLocaleString()}*\n` +
        `♡ Estado » *${estado}*\n` +
        `❖ Fuente » *${serie}*`

      await conn.sendFile(m.chat, image, `${character.name}.jpg`, text, m)
    } catch (e) {
      console.error(e)
      await m.reply(`❖ Error: ${e.message}`)
    }
  }
}

export default rollCommand
