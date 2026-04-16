export default {
  name: 'slot',
  alias: ['casino','tragaperras'],
  category: 'rpg',
  async run(m, { args, conn }) {
    try {
      let user = await global.User.findOne({ id: m.sender })
      if (!user) return m.reply('Error')

      user.col = user.col || 0

      let bet = parseInt(args[0]) || 100
      if (isNaN(bet)) bet = 100
      if (bet < 10) bet = 10
      if (bet > 1000000) bet = 1000000

      if (user.col < bet) {
        return m.reply(`❌ No tienes suficiente\n💰 ${user.col}`)
      }

      user.col -= bet

      const symbols = ['🍒','🍋','🍉','⭐','💎','7️⃣']
      const roll = () => symbols[Math.floor(Math.random() * symbols.length)]

      let msg = await conn.sendMessage(m.chat, { text: '🎰 Girando...\n\n❔ | ❔ | ❔' }, { quoted: m })

      let slots = ['❔','❔','❔']

      // Animación
      for (let i = 0; i < 10; i++) {
        slots = [roll(), roll(), roll()]
        await conn.sendMessage(m.chat, {
          text: `🎰 Girando...\n\n${slots[0]} | ${slots[1]} | ${slots[2]}`
        }, { edit: msg.key })
        await new Promise(r => setTimeout(r, 200))
      }

      // Resultado final (se detienen uno por uno)
      let a = roll()
      slots[0] = a
      await conn.sendMessage(m.chat, {
        text: `🎰\n\n${slots[0]} | 🎲 | 🎲`
      }, { edit: msg.key })
      await new Promise(r => setTimeout(r, 400))

      let b = roll()
      slots[1] = b
      await conn.sendMessage(m.chat, {
        text: `🎰\n\n${slots[0]} | ${slots[1]} | 🎲`
      }, { edit: msg.key })
      await new Promise(r => setTimeout(r, 400))

      let c = roll()
      slots[2] = c

      let reward = 0
      let result = '❌ Perdiste'

      if (a === b && b === c) {
        reward = bet * 5
        result = '🎰 JACKPOT'
      } else if (a === b || b === c || a === c) {
        reward = bet * 2
        result = '✨ Ganaste'
      }

      user.col += reward

      await global.User.updateOne({ id: m.sender }, { $set: user })

      let txt = `🎰 RESULTADO\n\n${a} | ${b} | ${c}\n\n${result}\n💰 +${reward}\n💳 ${user.col}`

      await conn.sendMessage(m.chat, { text: txt }, { edit: msg.key })

    } catch (e) {
      console.error(e)
      m.reply('Error en slot')
    }
  }
}
