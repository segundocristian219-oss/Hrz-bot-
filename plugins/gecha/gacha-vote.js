import { promises as fs } from 'fs'

const charactersFilePath = './lib/characters.json'

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, 'utf-8')
  return JSON.parse(data)
}

function flattenCharacters(data) {
  return Object.values(data).flatMap(entry =>
    Array.isArray(entry.characters) ? entry.characters : []
  )
}

function getSeriesNameByCharacter(data, characterId) {
  const series = Object.values(data).find(entry =>
    Array.isArray(entry.characters) &&
    entry.characters.some(char => char.id === characterId)
  )
  return series?.name || 'Desconocido'
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(
        `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`
      )
    }

    if (!global.db.data.groupGacha) global.db.data.groupGacha = {}
    if (!global.db.data.groupGacha[m.chat]) {
      global.db.data.groupGacha[m.chat] = { users: {}, characters: {} }
    }

    const group = global.db.data.groupGacha[m.chat]

    if (!group.users[m.sender]) group.users[m.sender] = {}
    const groupUser = group.users[m.sender]

    const now = Date.now()
    const cooldown = 2 * 60 * 60 * 1000

    if (groupUser.lastVote && now < groupUser.lastVote) {
      const remaining = groupUser.lastVote - now
      const hours = Math.floor(remaining / 3600000)
      const minutes = Math.floor((remaining % 3600000) / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)

      let timeString = ''
      if (hours) timeString += `${hours} hora${hours !== 1 ? 's ' : ' '}`
      if (minutes) timeString += `${minutes} minuto${minutes !== 1 ? 's ' : ' '}`
      if (seconds || !timeString) timeString += `${seconds} segundo${seconds !== 1 ? 's' : ''}`

      return m.reply(`ꕥ Debes esperar *${timeString}* para votar de nuevo en este grupo.\n> Usa: *${usedPrefix}${command}*`)
    }

    const charName = args.join(' ').trim()
    if (!charName) return m.reply('❀ Debes especificar un personaje para votarlo.')

    const charactersData = await loadCharacters()
    const allCharacters = flattenCharacters(charactersData)
    const character = allCharacters.find(c => c.name.toLowerCase() === charName.toLowerCase())
    if (!character) return m.reply('ꕥ Personaje no encontrado. Asegúrate de que el nombre esté correcto.')

    if (!group.characters[character.id]) {
      group.characters[character.id] = {
        name: character.name,
        value: Number(character.value || 0),
        votes: 0,
        owners: {},
        dailyIncrement: {}
      }
    }

    const dbChar = group.characters[character.id]
    const today = new Date().toISOString().slice(0, 10)

    if (!dbChar.dailyIncrement || typeof dbChar.dailyIncrement !== 'object') {
      dbChar.dailyIncrement = {}
    }

    if (!dbChar.dailyIncrement[today]) dbChar.dailyIncrement[today] = 0
    const dailyVotes = dbChar.dailyIncrement[today]

    if (dailyVotes >= 900)
      return m.reply(`ꕥ *${dbChar.name}* ya tiene el valor máximo de hoy en este grupo.`)

    const voteIncrease = Math.min(900 - dailyVotes, Math.floor(Math.random() * 200) + 50)
    dbChar.value += voteIncrease
    dbChar.votes += 1
    dbChar.lastVotedAt = now
    dbChar.dailyIncrement[today] += voteIncrease
    groupUser.lastVote = now + cooldown

    const seriesName = getSeriesNameByCharacter(charactersData, character.id)

    await conn.reply(
      m.chat,
      `❀ Votaste por *${dbChar.name} (${seriesName})*\n> Su nuevo valor es *${dbChar.value.toLocaleString()}* en este grupo.`,
      m
    )

  } catch (err) {
    console.error(err)
    await conn.reply(
      m.chat,
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err}`,
      m
    )
  }
}

handler.help = ['votar']
handler.tags = ['anime']
handler.command = ['votar', 'vote']

export default handler
