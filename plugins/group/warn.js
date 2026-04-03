let handler = async (m, { conn, text, command, usedPrefix }) => {
    let who
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
    else who = m.chat

    if (!who) return conn.reply(m.chat, `*⚠️ USO CORRECTO DEL COMANDO*\n\nEtiqueta a alguien o responde a un mensaje con:\n*${usedPrefix + command}* @user`, m)

    let user = global.db.data.users[who]
    if (!user) return conn.reply(m.chat, '*❌ El usuario no existe en mi base de datos.*', m)
    
    // Inicializar contador si no existe
    if (typeof user.warn == 'undefined') user.warn = 0

    if (command == 'warn' || command == 'advertir') {
        user.warn += 1
        if (user.warn < 3) {
            await conn.reply(m.chat, `*⚠️ ADVERTENCIA ⚠️*\n\n*Usuario:* @${who.split`@`[0]}\n*Recibidas:* ${user.warn}/3\n\nSi llegas a *3*, serás eliminado automáticamente.`, m, { mentions: [who] })
        } else {
            user.warn = 0 
            await conn.reply(m.chat, `*🚫 ELIMINADO 🚫*\n\nEl usuario @${who.split`@`[0]} alcanzó el límite de advertencias.`, m, { mentions: [who] })
            await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
        }
    }

    if (command == 'delwarn' || command == 'quitarwarn') {
        if (user.warn > 0) {
            user.warn -= 1
            await conn.reply(m.chat, `*✅ ADVERTENCIA ELIMINADA*\n\n*Usuario:* @${who.split`@`[0]}\n*Restantes:* ${user.warn}/3`, m, { mentions: [who] })
        } else {
            await conn.reply(m.chat, `*El usuario no tiene advertencias previas.*`, m)
        }
    }

    if (command == 'warns' || command == 'advertencias') {
        await conn.reply(m.chat, `*📊 ESTADO DE ADVERTENCIAS*\n\n*Usuario:* @${who.split`@`[0]}\n*Total:* ${user.warn}/3`, m, { mentions: [who] })
    }
}

handler.help = ['warn', 'delwarn', 'warns']
handler.tags = ['group']
handler.command = /^(warn|advertir|delwarn|quitarwarn|warns|advertencias)$/i

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
