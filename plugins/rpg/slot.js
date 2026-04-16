export default {
  name: 'slot',
  alias: ['casino','tragaperras'],
  category: 'rpg',
  async run(m, { args, conn }) {
    try {
      let user = await global.User.findOne({ id: m.sender })
      if (!user) return m.reply('Error')

      /*
      if (!global.owner || !global.owner.includes(m.sender)) {
        return m.reply('❌ Solo el owner puede usar este comando')
      }
      */

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
      const sleep = (ms) => new Promise(r => setTimeout(r, ms))

      let msg = await conn.sendMessage(m.chat, {
        text: '🎰\n\n❔ | ❔ | ❔'
      }, { quoted: m })

      const edit = async (text) => {
        await conn.relayMessage(
          m.chat,
          {
            protocolMessage: {
              key: msg.key,
              type: 14,
              editedMessage: { conversation: text }
            }
          },
          {}
        )
      }

      let a = '❔', b = '❔', c = '❔'

      let speeds = [90, 120, 160, 220]

      for (let s of speeds) {
        a = roll()
        b = roll()
        c = roll()
        await edit(`🎰 Girando...\n\n${a} | ${b} | ${c}`)
        await sleep(s)
      }

      a = roll()
      for (let s of speeds) {
        b = roll()
        c = roll()
        await edit(`🎰\n\n${a} | ${b} | ${c}`)
        await sleep(s)
      }

      b = roll()
      for (let s of speeds) {
        c = roll()
        await edit(`🎰\n\n${a} | ${b} | ${c}`)
        await sleep(s)
      }

      c = roll()

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

      await edit(`🎰 RESULTADO\n\n${a} | ${b} | ${c}\n\n${result}\n💰 +${reward}\n💳 ${user.col}`)

    } catch (e) {
      console.error(e)
      m.reply('Error en slot')
    }
  }
}
