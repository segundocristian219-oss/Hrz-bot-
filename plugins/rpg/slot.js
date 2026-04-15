export default {
  name: 'slot',
  alias: ['casino','tragaperras'],
  category: 'rpg',
  async run(m, { args, conn }) {
    try {
      let user = await global.User.findOne({ id: m.sender })
      if (!user) return m.reply('Error')

      if (!global.slotSystem) {
        global.slotSystem = {
          jackpot: 10000,
          mega: 50000,
          skins: ['gold','neon','fire','ice','shadow']
        }
      }

      user.col = user.col || 0
      user.plays = user.plays || 0
      user.wins = user.wins || 0
      user.loses = user.loses || 0
      user.inventory = Array.isArray(user.inventory) ? user.inventory : []
      user.missions = user.missions || { daily: 0 }
      user.achievements = Array.isArray(user.achievements) ? user.achievements : []

      let sub = (args[0] || '').toLowerCase()

      if (!sub) {
        return conn.sendMessage(m.chat, {
          text: `🎰 SISTEMA SLOT\n\n• .slot play 100\n• .slot inv\n• .slot top\n• .slot info\n\n💰 Coins: ${user.col}\n🏆 Jackpot: ${global.slotSystem.jackpot}`
        }, { quoted: m })
      }

      if (sub === 'info') {
        return m.reply(`🎰 INFO SLOT\n\n• Jackpot global acumulativo\n• Mega jackpot raro\n• Skins con bonus\n• Misiones diarias\n• Logros\n\nProbabilidades:\n- Doble: x2\n- Triple: x8\n- Jackpot global: raro\n- Mega: ultra raro`)
      }

      if (sub === 'inv') {
        return m.reply(`🎒 INVENTARIO\n\n${user.inventory.length ? user.inventory.join('\n') : 'Vacío'}`)
      }

      if (sub === 'top') {
        let top = await global.User.find().sort({ col: -1 }).limit(5)
        let txt = '🏆 TOP CASINO\n\n'
        top.forEach((u, i) => {
          txt += `${i + 1}. ${u.name || 'User'} - ${u.col}\n`
        })
        return m.reply(txt)
      }

      if (sub === 'play') {
        let bet = parseInt(args[1]) || 100
        if (isNaN(bet)) bet = 100
        if (bet < 10) bet = 10
        if (bet > 1000000) bet = 1000000

        if (user.col < bet) {
          return m.reply(`❌ No tienes suficiente\n💰 ${user.col}`)
        }

        user.col -= bet

        global.slotSystem.jackpot += Math.floor(bet * 0.15)
        global.slotSystem.mega += Math.floor(bet * 0.05)

        const symbols = ['🍒','🍋','🍉','⭐','💎','7️⃣']
        const roll = () => symbols[Math.floor(Math.random() * symbols.length)]

        let a = roll()
        let b = roll()
        let c = roll()

        let multi = 1
        if (user.vip) multi += 0.2
        if (user.luck) multi += user.luck * 0.05
        if (user.inventory.includes('gold')) multi += 0.1

        if (Math.random() < multi * 0.1) a = b

        let reward = 0
        let result = '❌ Perdiste'

        if (a === b && b === c) {
          reward = bet * 8
          result = '🎰 JACKPOT'
          user.wins++
        } else if (a === b || b === c) {
          reward = bet * 2
          result = '✨ Ganaste'
          user.wins++
        } else {
          user.loses++
        }

        if (Math.random() < 0.01) {
          reward += global.slotSystem.jackpot
          result = '💰 JACKPOT GLOBAL'
          global.slotSystem.jackpot = 10000
        }

        if (Math.random() < 0.003) {
          reward += global.slotSystem.mega
          result = '🔥 MEGA JACKPOT'
          global.slotSystem.mega = 50000
        }

        user.col += reward
        user.plays++

        if (Math.random() < 0.03) {
          let skin = global.slotSystem.skins[Math.floor(Math.random() * global.slotSystem.skins.length)]
          if (!user.inventory.includes(skin)) user.inventory.push(skin)
        }

        user.missions.daily++
        if (user.missions.daily >= 10) {
          user.col += 500
          user.missions.daily = 0
        }

        if (user.plays >= 50 && !user.achievements.includes('slot_master')) {
          user.achievements.push('slot_master')
          user.col += 2000
        }

        await global.User.updateOne({ id: m.sender }, { $set: user })

        let txt = `🎰 SLOT\n\n${a} | ${b} | ${c}\n\n${result}\n💰 +${reward}\n💳 ${user.col}\n\n🏆 JP: ${global.slotSystem.jackpot}\n🔥 MEGA: ${global.slotSystem.mega}`

        return conn.sendMessage(m.chat, { text: txt }, { quoted: m })
      }

    } catch (e) {
      console.error(e)
      m.reply('Error en slot')
    }
  }
}
