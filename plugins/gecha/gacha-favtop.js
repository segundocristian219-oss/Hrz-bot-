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
  return Object.values(data)
    .flatMap(series => Array.isArray(series.characters) ? series.characters : [])
}

let handler = async (m, { conn, args, usedPrefix }) => {
  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(
        `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\n` +
        `Un *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`
      )
    }

    const structure = await loadCharacters()
    const allCharacters = flattenCharacters(structure)
    const votes = {}

    const groupGacha = global.db.data.groupGacha || {}

    for (const group of Object.values(groupGacha)) {
      if (!group.users) continue

      for (const user of Object.values(group.users)) {
        if (!user.favorite) continue
        votes[user.favorite] = (votes[user.favorite] || 0) + 1
      }
    }

    const ranked = allCharacters
      .map(c => ({
        id: String(c.id),
        name: c.name,
        votes: votes[c.id] || 0
      }))
      .filter(c => c.votes > 0)
      .sort((a, b) => b.votes - a.votes)

    if (!ranked.length) {
      return m.reply('❀ Aún no hay personajes favoritos.')
    }

    const page = Math.max(1, parseInt(args[0]) || 1)
    const perPage = 10
    const totalPages = Math.ceil(ranked.length / perPage)

    if (page > totalPages) {
      return m.reply(`ꕥ Página no válida. Total: *${totalPages}*`)
    }

    const slice = ranked.slice(
      (page - 1) * perPage,
      page * perPage
    )

    let text = '✰ *Top de personajes favoritos*\n\n'

    slice.forEach((c, i) => {
      const pos = (page - 1) * perPage + i + 1
      text += `#${pos} » *${c.name}*\n`
      text += `   ♡ ${c.votes} voto${c.votes !== 1 ? 's' : ''}\n`
    })

    text += `\n⌦ Página *${page}* de *${totalPages}*`

    await conn.reply(m.chat, text.trim(), m)

  } catch (e) {
    console.error(e)
    await m.reply(
      `⚠︎ Error al ejecutar el comando.\n\n${e.message}`
    )
  }
}

handler.command = ['favtop', 'favoritetop', 'favboard']
handler.tags = ['gacha']
handler.help = ['favtop [página]']
handler.group = true

export default handler
