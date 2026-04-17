let pending = global.marryPending || (global.marryPending = {})
let married = global.married || (global.married = {})

const getJid = (u) => {
  if (!u) return null
  if (typeof u === 'string') return u
  if (u?.id) return u.id
  if (u?.jid) return u.jid
  return null
}

export default {
  name: 'marry',
  alias: ['marry','casar','divorce','divorcio','aceptar','rechazar'],
  category: 'group',
  async run({ conn, m, command }) {

    const sender = m.sender
    const mention = m.mentionedJid?.[0]
    const target = getJid(mention)

    if (command === 'marry' || command === 'casar') {
      if (!target) return conn.reply(m.chat, 'Menciona a alguien.', m)
      if (target === sender) return conn.reply(m.chat, 'No puedes casarte contigo.', m)
      if (married[sender] || married[target]) return conn.reply(m.chat, 'Uno ya está casado.', m)

      pending[target] = { from: sender, chat: m.chat }

      return conn.reply(m.chat,
`💍 PROUESTA DE MATRIMONIO

@${sender.split('@')[0]} te propone matrimonio

Responde con:
.aceptar
.rechazar`,
      m, { mentions: [sender] })
    }

    if (command === 'aceptar') {
      const data = pending[sender]
      if (!data) return conn.reply(m.chat, 'No tienes propuestas.', m)

      married[sender] = data.from
      married[data.from] = sender
      delete pending[sender]

      return conn.reply(m.chat,
`💍 MATRIMONIO

@${sender.split('@')[0]} y @${data.from.split('@')[0]} ahora están casados`,
      m, { mentions: [sender, data.from] })
    }

    if (command === 'rechazar') {
      const data = pending[sender]
      if (!data) return conn.reply(m.chat, 'No tienes propuestas.', m)

      delete pending[sender]

      return conn.reply(m.chat, 'Propuesta rechazada.', m)
    }

    if (command === 'divorce' || command === 'divorcio') {
      const pareja = married[sender]
      if (!pareja) return conn.reply(m.chat, 'No estás casado.', m)

      delete married[sender]
      delete married[pareja]

      return conn.reply(m.chat,
`💔 DIVORCIO

@${sender.split('@')[0]} ya no está casado`,
      m, { mentions: [sender, pareja] })
    }
  }
}
