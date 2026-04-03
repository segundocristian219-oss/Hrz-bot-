let handler = async (m, { conn, text, command, usedPrefix }) => {
    let who
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    else who = m.chat

    if (!who) return conn.reply(m.chat, `*¿A quién quieres advertir?*\n\nEtiqueta a alguien o responde a un mensaje con *${usedPrefix + command}*`, m)

    let user = global.db.data.users[who]
    if (!user) return conn.reply(m.chat, '*El usuario no está en mi base de datos.*', m)

    // Inicializar el contador si no existe
    if (typeof user.warn == 'undefined') user.warn = 0

    // Lógica de advertencia (Límite: 3)
    if (user.warn < 2) {
        user.warn += 1
        await conn.reply(m.chat, `*⚠️ ADVERTENCIA ⚠️*\n\n*Usuario:* @${who.split`@`[0]}\n*Advertencias:* ${user.warn}/3\n\nSi llegas a *3*, serás eliminado automáticamente del grupo.`, m, { mentions: [who] })
    } else {
        user.warn = 0 // Reiniciar antes de expulsar
        await conn.reply(m.chat, `*🚫 ELIMINADO 🚫*\n\nEl usuario @${who.split`@`[0]} superó las 3 advertencias permitidas.`, m, { mentions: [who] })
        await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
    }
}

handler.help = ['warn']
handler.tags = ['group']
handler.command = /^(warn)$/i

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
