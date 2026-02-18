import { promises as fs } from "fs"

const charactersFilePath = "./lib/characters.json"

function decodeId(str) {

  return String(str)
    .split("")
    .map(c => {
      if (c === "\u200B") return "0"
      if (c === "\u200C") return "1"
      if (c === "\u200D") return "2"
      if (c === "\u2060") return "3"
      if (c === "\u2061") return "4"
      if (c === "\u2062") return "5"
      if (c === "\u2063") return "6"
      if (c === "\u2064") return "7"
      if (c === "\u2065") return "8"
      return "9"
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


async function safeGetName(conn, id) {

  try {
    const name = await conn.getName(id)
    return name?.trim() ? name : id.split("@")[0]
  } catch {
    return id.split("@")[0]
  }
}

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!m.quoted) return m.reply("✿ Debes *citar el mensaje del personaje* que quieres reclamar.")


  global.db.data.groupGacha = global.db.data.groupGacha || {}
  const group = global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || {
    users: {},
    characters: {},
    activeRolls: []

  }

  const groupUser = group.users[m.sender] || (group.users[m.sender] = {})
  const now = Date.now()
  const cooldown = 30 * 60 * 1000

  if (groupUser.lastClaim && now < groupUser.lastClaim) {
    const remaining = Math.ceil((groupUser.lastClaim - now) / 1000)
    const min = Math.floor(remaining / 60)
    const sec = remaining % 60
    const msg = `❖ Espera *${min ? min + "m " : ""}${sec}s* para volver a usar *${usedPrefix + command}* de nuevo.`
    return m.reply(msg)
  }


  const quotedText = m.quoted?.text || ""
  const match = quotedText.match(/\*[^*]+\*([\u200B-\u2066]+)/)
  if (!match) return m.reply("❀ No es un personaje valido.")
  const charId = decodeId(match[1])
  const roll = group.activeRolls.find(r => r.id === charId)
  if (!roll) return m.reply("❀ No hay ningún personaje activo.")


  if (
  roll.expiresAt &&
  now > roll.expiresAt &&
  !roll.user &&
  !(roll.reservedBy && now < roll.reservedUntil)
) {
  const expiredTime = ((now - roll.expiresAt) / 1000).toFixed(1)
  group.activeRolls = group.activeRolls.filter(r => r.id !== charId)
  return m.reply(`ꕥ El personaje *${roll.name}* ha expirado »͜  ${expiredTime}s.`)
}


  if (roll.reservedBy && roll.reservedBy !== m.sender && now < roll.reservedUntil) {
    const protector = await safeGetName(conn, roll.reservedBy)
    const remaining = Math.ceil((roll.reservedUntil - now) / 1000)
    return m.reply(`❀ Este personaje está protegido por *${protector}* durante *${remaining}s* más.`)

  }


  const charDB = group.characters[charId]

  if (charDB?.user) {

    const owner = await safeGetName(conn, charDB.user)

    return m.reply(`❀ *${roll.name}* ya fue reclamado por *${owner}*.`)

  }

  roll.user = m.sender
  roll.claimedAt = now
  roll.expiresAt = null
  roll.reservedBy = null
  roll.reservedUntil = null

  group.characters[charId] = roll
  groupUser.lastClaim = now + cooldown
  groupUser.characters = groupUser.characters || []
  if (!groupUser.characters.includes(charId)) groupUser.characters.push(charId)
  const userName = await safeGetName(conn, m.sender)
  const claimTime = roll.createdAt
  ? ((now - roll.createdAt) / 1000).toFixed(1)
  : null

  const userData = global.db.data.users[m.sender] || {}
  const customMsg = userData.claimMessage
  const defaultClaimMsg = "€character ha sido reclamado por €user"
const rawMessage = customMsg || defaultClaimMsg
  const finalMessage = rawMessage
  .replace(/€user/g, `*${userName}*`)
  .replace(/€character/g, `*${roll.name}*`)
  await conn.reply(m.chat, `❀ ${finalMessage} (${claimTime})`, m)

  setTimeout(() => {
    const stillActive = group.activeRolls.find(r => r.id === charId)

    if (stillActive && !stillActive.user) {
      group.activeRolls = group.activeRolls.filter(r => r.id !== charId)

    }
  }, 60_000)
}

handler.help = ["claim", "c", "reclamar"]
handler.tags = ["gacha"]
handler.command = ["claim", "c", "reclamar"]
handler.group = true

export default handler
