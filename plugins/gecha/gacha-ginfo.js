import { promises as fs } from "fs"

const charactersFilePath = "./lib/characters.json"

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, "utf-8")
  return JSON.parse(data)
}

function flattenCharacters(data) {
  return Object.entries(data).flatMap(([_, serie]) =>
    Array.isArray(serie.characters) ? serie.characters : []
  )
}

function formatTime(ms) {
  if (ms <= 0) return "Ahora"
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  let parts = []
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`)
  if (minutes > 0 || hours > 0)
    parts.push(`${minutes} minuto${minutes !== 1 ? "s" : ""}`)
  parts.push(`${seconds} segundo${seconds !== 1 ? "s" : ""}`)
  return parts.join(" ")
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const chatData = global.db.data.chats?.[m.chat] || {}
  if (!chatData.gacha && m.isGroup) {
    return m.reply(
      `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`
    )
  }

  try {
    global.db.data.groupGacha = global.db.data.groupGacha || {}
    global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || {
      characters: {},
      users: {}
    }

    const groupData = global.db.data.groupGacha[m.chat]

    const user = groupData.users[m.sender] || { characters: [] }
    groupData.users[m.sender] = user

    const now = Date.now()
    const claimCD = user.lastClaim && now < user.lastClaim ? user.lastClaim - now : 0
    const rollCD = user.lastRoll && now < user.lastRoll ? user.lastRoll - now : 0
    const voteCD = user.lastVote && now < user.lastVote ? user.lastVote - now : 0

    const allCharacters = await loadCharacters()
    const flatChars = flattenCharacters(allCharacters)
    const totalChars = flatChars.length
    const totalSeries = Object.keys(allCharacters).length

    const userCharacters = Object.entries(groupData.characters || {})
      .filter(([_, c]) => c.user === m.sender)
      .map(([id]) => id)

    const totalValue = userCharacters.reduce((sum, id) => {
      const char = groupData.characters?.[id]
      const base = flatChars.find(c => c.id === id)?.value || 0
      const value = typeof char?.value === "number" ? char.value : base
      return sum + value
    }, 0)

    const userName =
      user.name || (await conn.getName(m.sender)) || m.sender.split("@")[0]

    const infoMsg = `*❀ Usuario* \`<${userName}>\`

ⴵ Claim » *${formatTime(claimCD)}*
ⴵ RollWaifu » *${formatTime(rollCD)}*
ⴵ Vote » *${formatTime(voteCD)}*

♡ Personajes reclamados » *${userCharacters.length}*
✰ Valor total » *${totalValue.toLocaleString()}*
❏ Personajes totales » *${totalChars}*
❏ Series totales » *${totalSeries}*`

    await m.reply(infoMsg.trim())
  } catch (e) {
    await conn.reply(
      m.chat,
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`,
      m
    )
  }
}

handler.help = ["gachainfo", "ginfo", "infogacha"]
handler.tags = ["gacha"]
handler.command = ["gachainfo", "ginfo", "infogacha"]
handler.group = true

export default handler
