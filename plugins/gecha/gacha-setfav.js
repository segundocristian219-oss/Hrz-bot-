import { promises as fs } from 'fs'

const charactersFilePath = './lib/characters.json'

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    await fs.writeFile(charactersFilePath, '{}')
    return {}
  }
}

function flattenCharacters(data) {
  return Object.values(data).flatMap(series =>
    Array.isArray(series.characters) ? series.characters : []
  )
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(
        `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\n` +
        `Un *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`
      )
    }

    if (!args.length) {
      return m.reply(
        `❀ Debes especificar un personaje.\n` +
        `> Ejemplo » *${usedPrefix + command} Hitori Gotou*`
      )
    }
    global.db.data.groupGacha ||= {}
    const group = global.db.data.groupGacha[m.chat] ||= {
      characters: {},
      users: {}
    }

    group.users[m.sender] ||= {}

    global.db.data.users ||= {}
    global.db.data.users[m.sender] ||= {}
    global.db.data.users[m.sender].votes ||= {}

    const structure = await loadCharacters()
    const allCharacters = flattenCharacters(structure)

    const name = args.join(' ').toLowerCase().trim()

    const character =
      allCharacters.find(c => c.name?.toLowerCase() === name) ||
      allCharacters.find(c => c.name?.toLowerCase().includes(name)) ||
      allCharacters.find(c =>
        name.split(' ').some(q => c.name?.toLowerCase().includes(q))
      )

    if (!character) {
      return m.reply(`ꕥ No se encontró el personaje *${name}*.`)
    }

    const charId = String(character.id)

    if (group.characters[charId]?.user !== m.sender) {
      return m.reply(
        `ꕥ El personaje *${character.name}* no está reclamado por ti.`
      )
    }

    const previousFav = group.users[m.sender].favorite
    group.users[m.sender].favorite = charId

    const votes = global.db.data.users[m.sender].votes
    votes[charId] = (votes[charId] || 0) + 1

    if (previousFav && previousFav !== charId) {
      return m.reply(
        `❀ Ahora *${character.name}* es tu personaje favorito`
      )
    }

    return m.reply(
      `❀ Ahora *${character.name}* es tu personaje favorito`
    )

  } catch (e) {
    console.error(e)
    return m.reply(
      `⚠︎ Ocurrió un error al ejecutar *${usedPrefix + command}*.\n\n${e.message}`
    )
  }
}

handler.command = ['setfav', 'setfavourite']
handler.tags = ['gacha']
handler.help = ['setfav <personaje>']
handler.group = true

export default handler
