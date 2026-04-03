const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warns', 'advertencias'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, command, usedPrefix }) => {
        try {
            let who
            if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
            else who = m.chat

            if (!who) return conn.reply(m.chat, `*⚠️ USO DEL COMANDO*\n\nEtiqueta a alguien o responde a un mensaje:\n*${usedPrefix + command}* @user`, m)

            let user = global.db.data.users[who]
            if (!user) return conn.reply(m.chat, '*❌ El usuario no está en mi base de datos.*', m)
            
            // Inicializar el contador si no existe
            if (typeof user.warn == 'undefined') user.warn = 0

            // Lógica: ADVERTIR
            if (command === 'warn' || command === 'advertir') {
                user.warn += 1
                if (user.warn < 3) {
                    await conn.reply(m.chat, `*⚠️ ADVERTENCIA ⚠️*\n\n*Usuario:* @${who.split`@`[0]}\n*Recibidas:* ${user.warn}/3\n\nSi llegas a *3*, serás eliminado automáticamente.`, m, { mentions: [who] })
                } else {
                    user.warn = 0 
                    await conn.reply(m.chat, `*🚫 LÍMITE ALCANZADO 🚫*\n\nEl usuario @${who.split`@`[0]} ha sido eliminado por acumular 3 advertencias.`, m, { mentions: [who] })
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                }
            }

            // Lógica: QUITAR ADVERTENCIA
            if (command === 'delwarn' || command === 'quitarwarn') {
                if (user.warn > 0) {
                    user.warn -= 1
                    await conn.reply(m.chat, `*✅ ADVERTENCIA REMOVIDA*\n\n*Usuario:* @${who.split`@`[0]}\n*Ahora tiene:* ${user.warn}/3`, m, { mentions: [who] })
                } else {
                    await conn.reply(m.chat, `*El usuario no tiene advertencias que quitar.*`, m)
                }
            }

            // Lógica: VER ADVERTENCIAS
            if (command === 'warns' || command === 'advertencias') {
                await conn.reply(m.chat, `*📊 ESTADO DE ADVERTENCIAS*\n\n*Usuario:* @${who.split`@`[0]}\n*Total acumulado:* ${user.warn}/3`, m, { mentions: [who] })
            }

        } catch (e) {
            console.error(e)
            // Opcional: avisar si hay un error en consola
        }
    }
}

export default warnCommand
