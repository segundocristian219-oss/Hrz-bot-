let handler = async (m, { conn, Array, text, usedPrefix, command, args }) => {
    // Inicializar base de datos
    let db = global.db.data
    let chat = db.chats[m.chat] || {}
    if (!chat.warnings) chat.warnings = {}
    if (chat.warnLimit === undefined) chat.warnLimit = 3 // Límite por defecto

    // Identificar usuario
    let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : text ? text.replace(/[^\d]/g, '') + '@s.whatsapp.net' : null
    
    // Verificación de Admins
    let groupMetadata = await conn.groupMetadata(m.chat)
    let admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id)
    let isAdmin = admins.includes(m.sender)
    let isBotAdmin = admins.includes(conn.user.jid || conn.user.id.split(':')[0] + '@s.whatsapp.net')

    // Fecha formateada
    let date = new Intl.DateTimeFormat('es-VE', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).format(new Date())

    switch (command) {
        case 'setwarnlimit':
            if (!isAdmin) return m.reply('🚫 *Este comando es para Administradores.*')
            let limit = parseInt(args[0])
            if (isNaN(limit) || limit < 0) return m.reply(`《✧》 Uso: ${usedPrefix + command} <número>`)
            chat.warnLimit = limit
            return m.reply(`⛊ Límite de advertencias establecido en: *${limit}*`)

        case 'warns':
            if (!who) return m.reply(`《✧》 Etiqueta a alguien para ver sus warns.`)
            let list = chat.warnings[who] || []
            if (list.length === 0) return m.reply(`✿ @${who.split('@')[0]} está limpio de advertencias.`, null, { mentions: [who] })
            let txt = `✿ *Advertencias de* @${who.split('@')[0]}:\n\n`
            list.forEach(w => txt += `*ID:* #${w.id}\n*Razón:* ${w.reason}\n*Fecha:* ${w.date}\n\n`)
            return conn.reply(m.chat, txt.trim(), m, { mentions: [who] })

        case 'warn':
            if (!isAdmin) return m.reply('🚫 *Solo administradores.*')
            if (!who) return m.reply(`《✧》 Etiqueta o responde a alguien.\nUso: ${usedPrefix + command} @user <razón>`)
            
            let reason = text ? text.replace(/@\d+/g, '').trim() : 'Sin razón especificada'
            let userWarns = chat.warnings[who] || []
            let id = userWarns.length > 0 ? Math.max(...userWarns.map(w => w.id)) + 1 : 1
            
            userWarns.unshift({ id, reason, date })
            chat.warnings[who] = userWarns

            let msg = `⛊ @${who.split('@')[0]} ha sido advertido.\n`
            msg += `✿ *Total:* ${userWarns.length}/${chat.warnLimit}\n\n`
            userWarns.forEach(w => msg += `*#${w.id}* - ${w.reason}\n`)

            await conn.reply(m.chat, msg.trim(), m, { mentions: [who] })

            if (chat.warnLimit > 0 && userWarns.length >= chat.warnLimit) {
                if (!isBotAdmin) return m.reply('⚠️ El usuario llegó al límite pero no soy admin para eliminarlo.')
                await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                chat.warnings[who] = []
            }
            break

        case 'delwarn':
            if (!isAdmin) return m.reply('🚫 *Solo administradores.*')
            if (!who) return m.reply(`《✧》 Indica el usuario y el ID.\nEjemplo: ${usedPrefix + command} @user 1`)
            let warnId = parseInt(args.find(a => !a.includes('@')))
            if (!warnId) return m.reply(`《✧》 Debes poner el número de ID.`)
            
            let userW = chat.warnings[who] || []
            let index = userW.findIndex(w => w.id === warnId)
            if (index === -1) return m.reply(`❌ No existe el warn #${warnId}`)
            
            userW.splice(index, 1)
            chat.warnings[who] = userW
            return m.reply(`❀ Advertencia #${warnId} eliminada para @${who.split('@')[0]}`, null, { mentions: [who] })

        case 'resetwarn':
            if (!isAdmin) return m.reply('🚫 *Solo administradores.*')
            if (!who) return m.reply(`《✧》 Menciona a alguien para resetear sus warns.`)
            chat.warnings[who] = []
            return m.reply(`⛊ Advertencias restablecidas para @${who.split('@')[0]}`, null, { mentions: [who] })
    }
}

handler.command = ['warn', 'delwarn', 'warns', 'resetwarn', 'setwarnlimit']
handler.group = true // Solo funciona en grupos
handler.admin = false // No lo pongas en true aquí para que el comando cargue y maneje sus propios mensajes de error

export default handler
