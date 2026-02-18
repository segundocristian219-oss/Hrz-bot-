import fetch from "node-fetch"
import { promises as fs } from "fs"
import path from "path"

const charactersFilePath = "./lib/characters.json"

function encodeId(id) {
  return String(id)
    .split("")
    .map(d => {
      if (d === "0") return "\u200B"
      if (d === "1") return "\u200C"
      if (d === "2") return "\u200D"
      if (d === "3") return "\u2060"
      if (d === "4") return "\u2061"
      if (d === "5") return "\u2062"
      if (d === "6") return "\u2063"
      if (d === "7") return "\u2064"
      if (d === "8") return "\u2065"
      return "\u2066"
    })
    .join("")
}

async function loadCharacters() {
  try {
    await fs.access(charactersFilePath)
  } catch {
    await fs.writeFile(charactersFilePath, "{}")
  }
  const data = await fs.readFile(charactersFilePath, "utf-8")
  return JSON.parse(data)
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

async function buscarImagenDelirius(query) {
  const tag = formatTag(query)

  const sources = [
    {
      name: "Safebooru",
      url: `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}&limit=20`,
      parse: json => Array.isArray(json) ? json : json?.post || []
    },
    {
      name: "Danbooru",
      url: `https://danbooru.donmai.us/posts.json?tags=${tag}&limit=10`,
      parse: json => Array.isArray(json) ? json : []
    },
    {
      name: "Gelbooru",
      url: `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}&limit=20&api_key=f965be362e70972902e69652a472b8b2df2c5d876cee2dc9aebc7d5935d128db98e9f30ea4f1a7d497e762f8a82f132da65bc4e56b6add0f6283eb9b16974a1a&user_id=1862243`,
      parse: json => json?.post || json?.data || []
    }
  ]

  const sourcesaleatory = [...sources].sort(() => Math.random() - 0.5)
  for (const src of sourcesaleatory) {
    try {
      const res = await fetch(src.url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      })

      if (!res.ok) continue

      const type = res.headers.get("content-type") || ""
      if (!type.includes("json")) continue

      const json = await res.json()
      const posts = src.parse(json)

      const images = posts
        .map(p =>
          p?.file_url ||
          p?.large_file_url ||
          p?.image ||
          p?.image_url ||
          p?.media_asset?.variants?.[0]?.url ||
          p?.preview_file_url
        )
        .filter(u => typeof u === "string" && /\.(jpe?g|png)$/i.test(u))

      if (images.length) {
        return Array.from(new Set(images))
      }
    } catch (err) {}
  }

  return []
}

const rollCommand = {
  name: 'roll',
  alias: ['rw', 'rollwaifu'],
  category: 'gacha',
  run: async (m, { conn, usedPrefix, command, chat }) => {
    try {
      if (!chat.gacha && m.isGroup)
        return m.reply(
          `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`
        )

      global.db.data.groupGacha = global.db.data.groupGacha || {}
      const group = global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || {}

      group.users ||= {}
      group.characters ||= {}
      group.activeRolls ||= []

      const groupUser = group.users[m.sender] || (group.users[m.sender] = {})

      const now = Date.now()
      const cooldown = 15 * 60 * 1000

      if (groupUser.lastRoll && now < groupUser.lastRoll) {
        const remaining = Math.ceil((groupUser.lastRoll - now) / 1000)
        const min = Math.floor(remaining / 60)
        const sec = remaining % 60

        let msg = ""
        if (min > 0) msg += `${min} minuto${min !== 1 ? "s" : ""} `
        if (sec > 0 || msg === "")
          msg += `${sec} segundo${sec !== 1 ? "s" : ""}`

        return m.reply(
          `❖ Debes esperar *${msg.trim()}* para usar *${usedPrefix + command}* de nuevo.`
        )
      }

      const allData = await loadCharacters()
      const characters = flattenCharacters(allData)

      if (!characters.length)
        return m.reply("⚠︎ No hay personajes disponibles.")

      const character = characters[Math.floor(Math.random() * characters.length)]
      const charId = String(character?.id || Date.now())
      const serie = getSeriesNameByCharacter(allData, character.id)

      let images = []
      if (Array.isArray(character.tags) && character.tags.length) {
        for (const t of character.tags) {
          images = await buscarImagenDelirius(t)
          if (images.length) break
        }
      }

      if (!images.length)
        images = await buscarImagenDelirius(character.name || "")

      const validImages = images.filter(
        x => typeof x === "string" && /^https?:\/\//i.test(x)
      )

      if (!validImages.length)
        return m.reply(`❖ No se encontraron imágenes para *${character.name}*.`)

      const image = validImages[Math.floor(Math.random() * validImages.length)]

      let estado = "Libre"
      const charData = group.characters[charId]

      if (charData && charData.user) {
        const who = charData.user
        let name = global.db.data.users?.[who]?.name
        if (!name) {
          try {
            const n = await conn.getName(who)
            name = n && n.trim() ? n : who.split("@")[0]
          } catch {
            name = who.split("@")[0]
          }
        }
        estado = `Reclamado por ${name}`
      }

      const protectionTime = 30 * 1000
      const rollData = {
        id: charId,
        name: character.name || "Sin nombre",
        value: Number(character.value) || 100,
        gender: character.gender || "Desconocido",
        serie,
        reservedBy: m.sender,
        reservedUntil: now + protectionTime,
        createdAt: now,
        expiresAt: now + 60000,
        image
      }

      group.activeRolls.push(rollData)
      group.characters[charId] = group.characters[charId] || rollData
      groupUser.lastRoll = now + cooldown

      const hiddenId = encodeId(charId)
      const text =
        `❀ Nombre » *${rollData.name}*${hiddenId}\n` +
        `⚥ Género » *${rollData.gender}*\n` +
        `✰ Valor » *${rollData.value.toLocaleString()}*\n` +
        `♡ Estado » *${estado}*\n` +
        `❖ Fuente » *${serie}*`

      let ext = path.extname(new URL(image).pathname).toLowerCase()
      if (!ext) ext = ".jpg"

      await conn.sendFile(m.chat, image, `${character.name}${ext}`, text, m)
    } catch (e) {
      console.error("[roll] excepción:", e)
      await m.reply(`❖ Error en el sistema.\n\n${e.message}`)
    }
  }
}

export default rollCommand
