import { getRealJid } from '../../lib/identifier.js'

const handler = {
  name: 'marry',
  alias: ['casar', 'divorce', 'divorciar'],
  category: 'fun',
  run: async (m, { conn, command, text, user }) => {

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

    const yo = await global.User.findOne({ _id: user._id })

    if (!yo) return m.reply('Error')

    if (cmd === 'divorce' || cmd === 'divorciar') {

      if (!yo.marry) return m.reply('No estás casado')

      const pareja = fix(yo.marry)

      await global.User.updateOne(
        { _id: yo._id },
        { $unset: { marry: "" } }
      )

      await global.User.updateOne(
        { $or: [{ id: pareja }, { lid: pareja }] },
        { $unset: { marry: "" } }
      )

      return conn.sendMessage(m.chat, {
        text: `💔 Divorcio completado\n\n@${sender.split('@')[0]} ya no está casado`,
        mentions: [sender]
      }, { quoted: m })
    }

    const target = getTarget()
    if (!target) return m.reply('Menciona a alguien')

    if (target === sender) return m.reply('No puedes casarte contigo')

    if (yo.marry) return m.reply('Ya estás casado')

    const objetivo = await global.User.findOne({
      $or: [{ id: target }, { lid: target }]
    })

    if (!objetivo) return m.reply('Usuario no registrado')

    if (objetivo.marry) return m.reply('Esa persona ya está casada')

    const idTarget = fix(objetivo.lid || objetivo.id)

    await global.User.updateOne(
      { _id: yo._id },
      { $set: { marry: idTarget } }
    )

    await global.User.updateOne(
      { _id: objetivo._id },
      { $set: { marry: sender } }
    )

    return conn.sendMessage(m.chat, {
      text: `💍 MATRIMONIO\n\n@${sender.split('@')[0]} ❤️ @${idTarget.split('@')[0]}`,
      mentions: [sender, idTarget]
    }, { quoted: m })
  }
}

export default handler
