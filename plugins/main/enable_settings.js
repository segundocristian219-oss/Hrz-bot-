const gachaSwitchCommand = {
  name: 'gacha',
  alias: ['gachaswitch'],
  category: 'config',
  admin: true,
  group: true,
  run: async (m, { text, usedPrefix, command, chat }) => {
    if (!text) return m.reply(`❀ ¿Qué deseas hacer?\n\n> Ejemplo: *${usedPrefix}${command} on* o *off*`)
    
    if (text.toLowerCase() === 'on') {
      chat.gacha = true
      m.reply(`✅ Los comandos de *Gacha* han sido activados en este grupo.`)
    } else if (text.toLowerCase() === 'off') {
      chat.gacha = false
      m.reply(`❌ Los comandos de *Gacha* han sido desactivados en este grupo.`)
    } else {
      m.reply(`> Opción no válida. Usa *on* o *off*.`)
    }
  }
}

export default gachaSwitchCommand
