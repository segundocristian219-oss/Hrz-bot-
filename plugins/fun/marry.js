import { getRealJid } from '../../lib/identifier.js'

const handler = {
  name: 'matrimonio',
  alias: ['marry', 'casar', 'aceptar', 'rechazar', 'divorce', 'divorciar'],
  category: 'fun',
  run: async (m, { conn, command, text, user, usedPrefix }) => {

    global.weddingGames = global.weddingGames || {}

    const fix = (id) => getRealJid(id || '').trim()
    const sender = fix(m.sender)
    const cmd = command.toLowerCase()

    const getTarget = () => {
      if (m.mentionedJid?.[0]) return fix(m.mentionedJid[0])
      if (m.quoted?.sender) return fix(m.quoted.sender)
      if (text) {
        const num = text.replace(/[^0-9]/g, '')
        if (num) return fix(num + '@s.whatsapp.net')
      }
      return null
    }

    const findGame = () => {
      for (let key in global.weddingGames) {
        const g = global.weddingGames[key]
        if (!g) continue

        if (
          fix(g.receptor) === sender ||
          fix(g.solicitante) === sender
        ) return { key, game: g }
      }
      return null
    }

    if (cmd === 'aceptar' || cmd === 'rechazar') {

      const data = findGame()
      if (!data) return m.reply('No tienes solicitudes pendientes')

      const { key, game } = data
      clearTimeout(game.timeout)

      if (cmd === 'rechazar') {
        delete global.weddingGames[key]
        return m.reply('Rechazaste la propuesta')
      }

      const userA = await global.User.findOne({ $or: [{ id: game.solicitante }, { lid: game.solicitante }] })
      const userB = await global.User.findOne({ $or: [{ id: game.receptor }, { lid: game.receptor }] })

      if (!userA || !userB) {
        delete global.weddingGames[key]
        return m.reply('Error en usuarios')
      }

      const idA = fix(userA.lid || userA.id)
      const idB = fix(userB.lid || userB.id)

      await global.User.updateOne(
        { _id: userA._id },
        { $set: { marry: idB } }
      )

      await global.User.updateOne(
        { _id: userB._id },
        { $set: { marry: idA } }
      )

      delete global.weddingGames[key]

      return conn.sendMessage(m.chat, {
        text: `💍 MATRIMONIO\n\n@${idA.split('@')[0]} ❤️ @${idB.split('@')[0]}`,
        mentions: [idA, idB]
      }, { quoted: m })
    }

    if (cmd === 'divorce' || cmd === 'divorciar') {

      const me = await global.User.findOne({ _id: user._id })
      if (!me || !me.marry) return m.reply('No estás casado')

      const pareja = fix(me.marry)

      await global.User.updateOne(
        { _id: me._id },
        { $unset: { marry: "" } }
      )

      await global.User.updateOne(
        { $or: [{ id: pareja }, { lid: pareja }] },
        { $unset: { marry: "" } }
      )

      return conn.sendMessage(m.chat, {
        text: `💔 Divorcio completado`,
        mentions: [sender]
      }, { quoted: m })
    }

    const target = getTarget()
    if (!target || target === sender) return m.reply('Menciona a alguien válido')

    const yo = await global.User.findOne({ _id: user._id })
    if (yo?.marry) return m.reply('Ya estás casado')

    const objetivo = await global.User.findOne({
      $or: [{ id: target }, { lid: target }]
    })

    if (!objetivo) return m.reply('Usuario no registrado')
    if (objetivo.marry) return m.reply('Esa persona ya está casada')

    const idTarget = fix(objetivo.lid || objetivo.id)

    const id = m.chat + Date.now()

    global.weddingGames[id] = {
      solicitante: sender,
      receptor: idTarget,
      timeout: setTimeout(() => {
        delete global.weddingGames[id]
      }, 60000)
    }

    return conn.sendMessage(m.chat, {
      text: `💍 PROPUESTA DE MATRIMONIO\n\n@${sender.split('@')[0]} quiere casarse con @${idTarget.split('@')[0]}\n\n${usedPrefix}aceptar\n${usedPrefix}rechazar`,
      mentions: [sender, idTarget]
    }, { quoted: m })
  }
}

export default handler
