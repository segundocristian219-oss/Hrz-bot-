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

    const getUserId = (u) => fix(u?.lid || u?.id || '')

    const getMarryList = (u) => {
      if (!u?.marry) return []
      if (Array.isArray(u.marry)) return u.marry.map(fix)
      return [fix(u.marry)]
    }

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

        if (
          fix(g.solicitante) === sender ||
          fix(g.receptor) === sender
        ) return { key: k, game: g }
      }
      return null
    }

    if (cmd === 'aceptar' || cmd === 'rechazar') {
      const data = findGame()
      if (!data) return m.reply('*♛ No tienes solicitudes pendientes*')

      const { key, game } = data
      clearTimeout(game.timeout)

      if (cmd === 'rechazar') {
        delete global.weddingGames[key]
        return m.reply('*♛ Solicitud rechazada*')
      }

      if (game.tipo === 'divorcio') {
        await global.User.updateOne(
          { $or: [{ id: game.solicitante }, { lid: game.solicitante }] },
          { $pull: { marry: game.receptor } }
        )
        await global.User.updateOne(
          { $or: [{ id: game.receptor }, { lid: game.receptor }] },
          { $pull: { marry: game.solicitante } }
        )

        delete global.weddingGames[key]
        return m.reply('*♛ Divorcio completado*')
      }

      const userA = await global.User.findOne({
        $or: [{ id: game.solicitante }, { lid: game.solicitante }]
      })

      const userB = await global.User.findOne({
        $or: [{ id: game.receptor }, { lid: game.receptor }]
      })

      if (!userA || !userB) {
        delete global.weddingGames[key]
        return m.reply('*♛ Error en usuarios*')
      }

      const idA = getUserId(userA)
      const idB = getUserId(userB)

      await global.User.updateOne(
        { _id: userA._id },
        { $addToSet: { marry: idB } }
      )

      await global.User.updateOne(
        { _id: userB._id },
        { $addToSet: { marry: idA } }
      )

      delete global.weddingGames[key]

      return conn.sendMessage(m.chat, {
        text: `*♛ BODA ✧*\n\n@${idA.split('@')[0]} 💍 @${idB.split('@')[0]}`,
        mentions: [idA, idB]
      }, { quoted: m })
    }

    if (cmd === 'divorce' || cmd === 'divorcio') {
      const lista = getMarryList(user)
      if (!lista.length) return m.reply('*♛ No estás casado*')

      let target = getTarget()

      if (!target && lista.length === 1) {
        target = lista[0]
      }

      if (!target || !lista.includes(target)) {
        return m.reply('*♛ Menciona correctamente a tu pareja*')
      }

      const id = `${chat}-${Date.now()}`

      global.weddingGames[id] = {
        tipo: 'divorcio',
        solicitante: sender,
        receptor: target,
        timeout: setTimeout(() => {
          delete global.weddingGames[id]
        }, 20000)
      }

      return conn.sendMessage(chat, {
        text: `*♛ DIVORCIO ✧*\n\n@${sender.split('@')[0]} quiere divorciarse de @${target.split('@')[0]}\n\n${usedPrefix}aceptar`,
        mentions: [sender, target]
      }, { quoted: m })
    }

    const target = getTarget()
    if (!target || target === sender || target === fix(conn.user.id)) {
      return m.reply('*♛ Menciona a alguien válido*')
    }

    const lista = getMarryList(user)
    if (lista.includes(target)) {
      return m.reply('*♛ Ya estás casado con esa persona*')
    }

    const objetivo = await global.User.findOne({
      $or: [{ id: target }, { lid: target }]
    })

    if (!objetivo) return m.reply('*♛ Usuario no registrado*')

    const id = `${chat}-${Date.now()}`

    global.weddingGames[id] = {
      tipo: 'boda',
      solicitante: sender,
      receptor: getUserId(objetivo),
      timeout: setTimeout(() => {
        delete global.weddingGames[id]
      }, 20000)
    }

    return conn.sendMessage(chat, {
      text: `*♛ PROPUESTA ✧*\n\n@${sender.split('@')[0]} quiere casarse con @${target.split('@')[0]}\n\n${usedPrefix}aceptar\n${usedPrefix}rechazar`,
      mentions: [sender, target]
    }, { quoted: m })
  }
}

export default handler
