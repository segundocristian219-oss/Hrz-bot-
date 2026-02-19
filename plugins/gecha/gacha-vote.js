import { gachaService } from '../lib/gachaService.js'

const votarCommand = {
  name: 'votar',
  alias: ['vote'],
  category: 'anime',
  run: async (m, { conn, args, usedPrefix, command, chat }) => {
    try {
      if (!chat.gacha && m.isGroup) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      global.db.data.groupGacha ||= {}
      const group = global.db.data.groupGacha[m.chat] ||= { users: {} }
      group.users[m.sender] ||= {}
      const groupUser = group.users[m.sender]

      const now = Date.now()
      const cooldown = 2 * 60 * 60 * 1000

      if (groupUser.lastVote && now < groupUser.lastVote) {
        const remaining = groupUser.lastVote - now
        const hours = Math.floor(remaining / 3600000)
        const minutes = Math.floor((remaining % 3600000) / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        let timeString = (hours ? `${hours}h ` : "") + (minutes ? `${minutes}m ` : "") + `${seconds}s`
        return m.reply(`ꕥ Debes esperar *${timeString}* para votar de nuevo en este grupo.`)
      }

      const charName = args.join(' ').trim()
      if (!charName) return m.reply('❀ Debes especificar un personaje para votarlo.')

      const allCharacters = await gachaService.getAllCharacters()
      const character = allCharacters.find(c => c.name.toLowerCase() === charName.toLowerCase())
      
      if (!character) return m.reply('ꕥ Personaje no encontrado.')

      const voteIncrease = Math.floor(Math.random() * 200) + 50
      
      await gachaService.addVote(character.id, voteIncrease)
      
      groupUser.lastVote = now + cooldown

      await conn.reply(
        m.chat,
        `❀ Votaste por *${character.name} (${character.source})*\n> Se han sumado *${voteIncrease}* puntos a su valor global.`,
        m
      )

    } catch (err) {
      console.error(err)
      await m.reply(`⚠︎ Error al procesar el voto.\n\n${err.message}`)
    }
  }
}

export default votarCommand
