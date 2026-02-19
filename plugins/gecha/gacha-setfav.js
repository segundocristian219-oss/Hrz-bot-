import { gachaService } from '../../lib/gachaService.js'

const setFavCommand = {
  name: 'setfav',
  alias: ['setfavourite'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat, user }) => {
    try {
      if (!chat.gacha && m.isGroup) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      if (!args.length) return m.reply(`❀ Debes especificar un personaje.\n> Ejemplo » *${usedPrefix + command} Hitori Gotou*`)

      const nameQuery = args.join(' ').toLowerCase().trim()
      const allCharacters = await gachaService.getAllCharacters()

      const character = allCharacters.find(c => 
        c.name.toLowerCase() === nameQuery || 
        c.name.toLowerCase().includes(nameQuery)
      )

      if (!character) return m.reply(`ꕥ No se encontró el personaje *${nameQuery}*.`)

      const claim = await gachaService.getClaim(character.id, m.chat)

      if (!claim || claim.owner_jid !== m.sender) {
        return m.reply(`ꕥ El personaje *${character.name}* no está reclamado por ti en este grupo.`)
      }

      global.db.data.groupGacha ||= {}
      const group = global.db.data.groupGacha[m.chat] ||= { users: {} }
      group.users[m.sender] ||= {}
      
      group.users[m.sender].favorite = String(character.id)
      
      await gachaService.addVote(character.id, 10)

      return m.reply(`❀ Ahora *${character.name}* es tu personaje favorito y ha ganado +10 puntos de valor.`)

    } catch (e) {
      console.error(e)
      return m.reply(`⚠︎ Error al ejecutar el comando.\n\n${e.message}`)
    }
  }
}

export default setFavCommand
