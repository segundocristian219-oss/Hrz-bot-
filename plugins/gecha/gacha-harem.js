import { gachaService } from '../../lib/gachaService.js'

const haremCommand = {
  name: 'harem',
  alias: ['claims'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat }) => {
    try {
      if (m.isGroup && (!chat || !chat.gacha)) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      let target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
      let targetName = await conn.getName(target)

      const claims = await gachaService.getClaimsByGroup(m.chat)
      const userClaims = claims.filter(c => c.owner_jid === target)

      if (userClaims.length === 0) {
        return m.reply(`ꕥ *${targetName}* no tiene personajes reclamados en este grupo.`)
      }

      const allCharacters = await gachaService.getAllCharacters()
      const page = Math.max(1, parseInt(args[0]) || 1)
      const perPage = 50
      const totalPages = Math.ceil(userClaims.length / perPage)

      if (page > totalPages) {
        return m.reply(`❀ Página no válida. Hay un total de *${totalPages}* páginas.`)
      }

      const start = (page - 1) * perPage
      const end = start + perPage
      const pageItems = userClaims.slice(start, end)

      let text = `✿ Personajes reclamados (${userClaims.length}) ✿\n⌦ Usuario: *${targetName}*\n\n`

      for (const claim of pageItems) {
        const charInfo = allCharacters.find(c => c.id === claim.character_id)
        const charName = charInfo?.name || `ID: ${claim.character_id}`
        const charValue = charInfo?.buy || 0
        text += `» ${charName} (${charValue.toLocaleString()})\n`
      }

      text += `\n⌦ _Página ${page} de ${totalPages}_`

      await conn.reply(m.chat, text, m, { mentions: [target] })

    } catch (e) {
      console.error(e)
      await m.reply(`⚠ Error inesperado:\n${e.message}`)
    }
  }
}

export default haremCommand
