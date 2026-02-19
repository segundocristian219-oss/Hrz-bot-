import { gachaService } from '../../lib/gachaService.js'

const wimageCommand = {
  name: 'wimage',
  alias: ['cimage', 'charimage', 'waifuimage'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat }) => {
    try {
      if (m.isGroup && (!chat || !chat.gacha)) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      if (!args.length) {
        return m.reply(`❀ Por favor, indica un personaje.\n> Ejemplo » *${usedPrefix + command} Marin Kitagawa*`)
      }

      const allCharacters = await gachaService.getAllCharacters()
      const query = args.join(' ').toLowerCase().trim()

      const character = allCharacters.find(c => 
        c.name.toLowerCase() === query || 
        c.name.toLowerCase().includes(query)
      )

      if (!character) {
        return m.reply(`ꕥ No se encontró el personaje *${query}*.`)
      }

      const image = character.img
      if (!image) return m.reply(`ꕥ El personaje *${character.name}* no tiene una imagen configurada en la base de datos.`)

      const caption = `❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender || 'Desconocido'}*\n❖ Fuente » *${character.source}*`

      await conn.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m })

    } catch (e) {
      console.error(e)
      await m.reply(`⚠ Error inesperado:\n${e.message}`)
    }
  }
}

export default wimageCommand
