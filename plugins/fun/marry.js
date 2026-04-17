import { getRealJid } from '../../lib/identifier.js'

const handler = {
  name: 'matrimonio',
  alias: ['marry', 'casar', 'divorce', 'divorcio', 'aceptar', 'rechazar'],
  category: 'fun',
  run: async (m, { conn, command, text, user, usedPrefix }) => {
    global.weddingGames = global.weddingGames || {}

    const fix = (id) => getRealJid(id || '').trim()
    const sender = fix(m.sender)
    const chat = m.chat
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
      for (let k in global.weddingGames) {
        let g = global.weddingGames[k]
        if (!k.startsWith(chat)) continue
        if (!g) continue

        if (fix(g.solicitante) === sender || fix(g.receptor) === sender) {
          return { key: k, game: g }
        }
      }
      return null
    }

    if (cmd === 'aceptar' || cmd === 'rechazar') {
      const data = findGame()
      if (!data) return m.reply('No tienes solicitudes')

      const { key, game } = data
      clearTimeout(game.timeout)

      if (cmd === 'rechazar') {
        delete global.weddingGames[key]
        return m.reply('Rechazado')
      }

      if (game.tipo === 'divorcio') {
        await global.User.updateMany(
          { $or: [{ id: game.solicitante }, { id: game.receptor }, { lid: game.solicitante }, { lid: game.receptor }] },
          { $pull: { marry: { $in: [game.solicitante, game.receptor] } } }
        )

        delete global.weddingGames[key]
        return m.reply('Divorcio completado')
      }

      const userA = await global.User.findOne({ $or: [{ id: game.solicitante }, { lid: game.solicitante }] })
      const userB = await global.User.findOne({ $or: [{ id: game.receptor }, { lid: game.receptor }] })

      if (!userA || !userB) {
        delete global.weddingGames[key]
        return m.reply('Error usuarios')
      }

      const idA = fix(userA.lid || userA.id)
      const idB = fix(userB.lid || userB.id)

      await global.User.updateOne({ _id: userA._id }, { $addToSet: { marry: idB } })
      await global.User.updateOne({ _id: userB._id }, { $addToSet: { marry: idA } })

      delete global.weddingGames[key]

      return conn.sendMessage(chat, {
        text: `@${idA.split('@')[0]} 💍 @${idB.split('@')[0]}`,
        mentions: [idA, idB]
      }, { quoted: m })
    }

    if (cmd === 'divorce' || cmd === 'divorcio') {
      const target = getTarget()

      const me = await global.User.findOne({ _id: user._id })
      if (!me || !me.marry || me.marry.length === 0) {
        return m.reply('No estás casado')
      }

      let pareja = null

      if (target) {
        pareja = me.marry.find(x => fix(x) === target)
      } else if (me.marry.length === 1) {
        pareja = fix(me.marry[0])
      }

      if (!pareja) {
        return m.reply('Menciona correctamente a tu pareja')
      }

      const id = `${chat}-${Date.now()}`

      global.weddingGames[id] = {
        tipo: 'divorcio',
        solicitante: sender,
        receptor: pareja,
        timeout: setTimeout(() => delete global.weddingGames[id], 20000)
      }

      return conn.sendMessage(chat, {
        text: `@${sender.split('@')[0]} quiere divorciarse de @${pareja.split('@')[0]}\n\n${usedPrefix}aceptar`,
        mentions: [sender, pareja]
      }, { quoted: m })
    }

    const target = getTarget()
    if (!target || target === sender) return m.reply('Menciona a alguien')

    const objetivo = await global.User.findOne({
      $or: [{ id: target }, { lid: target }]
    })

    if (!objetivo) return m.reply('Usuario no registrado')

    const id = `${chat}-${Date.now()}`

    global.weddingGames[id] = {
      tipo: 'boda',
      solicitante: sender,
      receptor: fix(objetivo.lid || objetivo.id),
      timeout: setTimeout(() => delete global.weddingGames[id], 20000)
    }

    return conn.sendMessage(chat, {
      text: `@${sender.split('@')[0]} quiere casarse con @${target.split('@')[0]}\n\n${usedPrefix}aceptar\n${usedPrefix}rechazar`,
      mentions: [sender, target]
    }, { quoted: m })
  }
}

export default handler
