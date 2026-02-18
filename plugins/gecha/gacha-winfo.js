import { promises as fs } from "fs"

const charactersFilePath = "./lib/characters.json"

async function loadCharacters() {
  try {
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

function getSeriesNameByCharacter(data, characterId) {
  const entry = Object.values(data).find(series =>
    Array.isArray(series.characters) &&
    series.characters.some(c => String(c.id) === String(characterId))
  )
  return entry?.name || "Desconocido"
}

function formatTime(ms) {
  const sec = Math.floor(ms / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${d ? d + "d " : ""}${h ? h + "h " : ""}${m ? m + "m " : ""}${s ? s + "s" : ""}`.trim()
}

// Estructura optimizada para el command map de index.js
const cmd = {
  name: "winfo",
  alias: ["waifuinfo", "charinfo"],
  category: "gacha",
  desc: "Muestra información detallada de un personaje.",
  use: "<personaje>",
  group: true,
  run: async (m, { conn, args, prefix }) => {
    try {
      if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
        return m.reply(
          `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n` +
          `Un *administrador* puede activarlos con:\n» *${prefix}gacha on*`
        )
      }

      global.db.data.groupGacha ||= {}
      const group = global.db.data.groupGacha[m.chat] ||= {
        characters: {},
        users: {}
      }

      if (!args.length) {
        return m.reply(
          `❀ Debes especificar un personaje.\n` +
          `> Ejemplo » *${prefix}winfo Kaede*`
        )
      }

      const searchName = args.join(" ").toLowerCase().trim()

      const allCharactersData = await loadCharacters()
      const allFlat = flattenCharacters(allCharactersData)

      const baseChar = allFlat.find(
        c => c.name?.toLowerCase() === searchName
      )

      if (!baseChar) {
        return m.reply(`ꕥ No se encontró el personaje *${searchName}*.`)
      }

      const charId = String(baseChar.id)

      const dbChar = group.characters[charId] || {
        ...baseChar,
        value: 100,
        user: null,
        lastVotedAt: null
      }

      const charValue =
        typeof dbChar.value === "number" ? dbChar.value : 100

      let position = null
      if (group.characters[charId]) {
        const ranked = Object.entries(group.characters)
          .map(([id, info]) => ({
            id,
            value: typeof info.value === "number" ? info.value : 0
          }))
          .sort((a, b) => b.value - a.value)

        position = ranked.findIndex(c => c.id === charId) + 1
      }

      const claimedBy = dbChar.user
      let ownerName = null

      if (claimedBy) {
        global.db.data.users ||= {}
        global.db.data.users[claimedBy] ||= {}

        ownerName =
          global.db.data.users[claimedBy].name ||
          (await conn.getName(claimedBy).catch(() => claimedBy.split("@")[0]))

        global.db.data.users[claimedBy].name ||= ownerName
      }

      const estado = claimedBy
        ? `Reclamado por ${ownerName}`
        : "Libre"

      const seriesName = getSeriesNameByCharacter(allCharactersData, charId)

      const lastVoteTime = dbChar.lastVotedAt
        ? formatTime(Date.now() - dbChar.lastVotedAt)
        : "Nunca"

      const text =
        `❀ Nombre » *${baseChar.name}*\n` +
        `⚥ Género » *${baseChar.gender || "Desconocido"}*\n` +
        `✰ Valor » *${charValue.toLocaleString()}*\n` +
        `♡ Estado » *${estado}*\n` +
        `❖ Fuente » *${seriesName}*\n` +
        `❏ Puesto » ${position ? "#" + position : "Desconocido"}\n` +
        `ⴵ Último voto » hace *${lastVoteTime}*`

      await conn.reply(m.chat, text, m, {
        mentions: claimedBy ? [claimedBy] : []
      })

    } catch (err) {
      console.error(err)
      await conn.reply(
        m.chat,
        `⚠︎ Se ha producido un problema.\n` +
        `> Usa *${prefix}report* para informarlo.\n\n${err.message}`,
        m
      )
    }
  }
}

export default cmd
