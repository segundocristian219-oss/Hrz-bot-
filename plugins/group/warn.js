const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warns', 'advertencias'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            // Extraer el prefijo y el comando manualmente para evitar errores de estructura
            let usedPrefix = /^[./!#]/.test(m.text) ? m.text.match(/^[./!#]/)[0] : '.'
            let command = m.text.split(' ')[0].toLowerCase().replace(usedPrefix, '')
            
            let who
            if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false
            else who = m.chat

            if (!who) return conn.reply(m.chat, `*⚠️ USO DEL COMANDO*\n\nEtiqueta a alguien o responde a un mensaje:\n*${usedPrefix + command}* @user`, m)

            // Verificar o crear usuario en la base de datos
            if (!global.db.data.users[who]) global.db.data.users[who] = { warn: 0 }
            let user = global.db.data.users[who]
            
            // Obtener fecha y hora actual para el diseño
            let d = new Date()
            let time = d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
            let date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })

            // Lógica: ADVERTIR / WARN
            if (/warn|advertir/.test(command)) {
                user.warn += 1
                if (user.warn < 3) {
                    let txt = `*─── [ ⚠️ ADVERTENCIA ] ───*\n\n`
                    txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                    txt += `*📈 Advertencias:* ${user.warn}/3\n`
                    txt += `*📅 Fecha:* ${date}\n`
                    txt += `*⏰ Hora:* ${time}\n\n`
                    txt += `_Si llegas a 3 advertencias, serás eliminado del grupo._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                } else {
                    user.warn = 0 
                    let txt = `*─── [ 🚫 EXPULSADO ] ───*\n\n`
                    txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                    txt += `*📅 Fecha:* ${date}\n`
                    txt += `*⏰ Hora:* ${time}\n\n`
                    txt += `_El usuario ha superado el límite de advertencias y ha sido eliminado._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                }
            }

            // Lógica: QUITAR ADVERTENCIA / DELWARN
            if (/delwarn|quitarwarn/.test(command)) {
                if (user.warn > 0) {
                    user.warn -= 1
                    let txt = `*─── [ ✅ INFO ] ───*\n\n`
                    txt += `*Se ha removido una advertencia a:* @${who.split`@`[0]}\n`
                    txt += `*Estado actual:* ${user.warn}/3`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                } else {
                    await conn.reply(m.chat, `*El usuario no tiene advertencias acumuladas.*`, m)
                }
            }

            // Lógica: VER ADVERTENCIAS / WARNS
            if (/warns|advertencias/.test(command)) {
                let txt = `*─── [ 📊 ESTADO ] ───*\n\n`
                txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                txt += `*📉 Total acumulado:* ${user.warn}/3`
                await conn.reply(m.chat, txt, m, { mentions: [who] })
            }

        } catch (e) {
            console.error(e)
        }
    }
}

export default warnCommand
                                                      
