let handler = async (m, { conn, text, usedPrefix, command, args }) => {
    // 1. Referencia a la base de datos (siguiendo tu estilo)
    let db = global.db.data
    let chat = db.chats[m.chat] || {}
    
    // Inicializar variables si no existen
    if (!chat.warnings) chat.warnings = {}
    if (chat.warnLimit === undefined) chat.warnLimit = 3 

    // 2. Identificar al usuario (Prioridad: Citado > Mención > Texto)
    let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : text ? text.replace(/[^\d]/g, '') + '@s.whatsapp.net' : null

    // 3. Verificación de Administradores
    let groupMetadata = await conn.groupMetadata(m.chat)
    let participants = groupMetadata.participants
    let admins = participants.filter(p => p.admin).map(p => p.id)
    let isAdmin = admins.includes(m.sender)
    let isBotAdmin = admins.includes(conn.user.jid || conn.user.id.split(':')[0] + '@s.whatsapp.net')

    // 4. Formato de fecha (Estilo profesional)
    let date = new Intl.DateTimeFormat('es-VE', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).format(new Date())

    // --- LÓGICA DE COMANDOS ---
    switch (command) {
        case 'setwarnlimit':
            if (!isAdmin) return m.reply('🚫 *Esta función es solo para Administradores.*')
            let limit = parseInt(args[0])
            if (isNaN(limit) || limit < 0) return m.reply(`《✧》 Uso: ${usedPrefix + command} <número>`)
            chat.warnLimit = limit
            return m.reply(`⛊ Límite de advertencias actualizado a: *${limit}*`)

        case 'warns':
            if (!who) return m.reply(`《✧》 Menciona o responde a alguien para ver su historial.`)
            let list = chat.warnings[who] || []
            if (list.length === 0) return conn.reply(m.chat, `✿ @${who.split('@')[0]} no tiene advertencias activas. ✨`, m, { mentions: [who] })
            
            let txt = `╭━━━[ 📋 𝐇𝐈𝐒𝐓𝐎𝐑𝐈𝐀𝐋 ]━━━╮\n`
            txt += `┃ 👤 *Usuario:* @${who.split('@')[0]}\n`
            txt += `┃ 📊 *Total:* ${list.length}/${chat.warnLimit}\n`
            txt += `┣━━━━━━━━━━━━━━━━━━━━\n`
            list.forEach(w => {
                txt += `┃ 🆔 *#${w.id}* | ${w.reason}\n`
                txt += `┃ 📅 ${w.date}\n┃\n`
            })
            txt += `╰━━━━━━━━━━━━━━━━━━━━╯`
            return conn.reply(m.chat, txt.trim(), m, { mentions: [who] })

        case 'warn':
            if (!isAdmin) return m.reply('🚫 *No tienes permisos para advertir usuarios.*')
            if (!who) return m.reply(`《✧》 Etiqueta o responde a un usuario.\n\n💡 *Ejemplo:* ${usedPrefix + command} @user Spam`)
            
            let reason = text ? text.replace(/@\d+/g, '').trim() : 'Sin razón especificada'
            if (!chat.warnings[who]) chat.warnings[who] = []
            
            let id = chat.warnings[who].length > 0 ? Math.max(...chat.warnings[who].map(w => w.id)) + 1 : 1
            
            chat.warnings[who].unshift({ id, reason, date })

            let warnMsg = `╭━━━[ 🚨 𝐀𝐃𝐕𝐄𝐑𝐓𝐄𝐍𝐂𝐈𝐀 ]━━━╮\n`
            warnMsg += `┃ 👤 *Usuario:* @${who.split('@')[0]}\n`
            warnMsg += `┃ 📝 *Razón:* ${reason}\n`
            warnMsg += `┃ 🔢 *Warn:* ${chat.warnings[who].length}/${chat.warnLimit}\n`
            warnMsg += `┣━━━━━━━━━━━━━━━━━━━━\n`
            warnMsg += `┃ _Usa ${usedPrefix}warns para ver detalles._\n`
            warnMsg += `╰━━━━━━━━━━━━━━━━━━━━╯`

            await conn.reply(m.chat, warnMsg, m, { mentions: [who] })

            // Auto-kick si llega al límite
            if (chat.warnLimit > 0 && chat.warnings[who].length >= chat.warnLimit) {
                if (!isBotAdmin) return m.reply('⚠️ El usuario superó el límite, pero no soy admin para eliminarlo.')
                await m.reply(`🚨 @${who.split('@')[0]} alcanzó el límite y será eliminado.`)
                await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                chat.warnings[who] = [] // Reset tras kick
            }
            break

        case 'delwarn':
            if (!isAdmin) return m.reply('🚫 *Solo administradores.*')
            if (!who) return m.reply(`《✧》 Menciona al usuario e indica el ID.\nEjemplo: ${usedPrefix + command} @user 1`)
            
            let warnId = parseInt(args.find(a => !a.includes('@')))
            if (!warnId) return m.reply(`《✧》 Indica el número de ID (#ID) que viste en ${usedPrefix}warns.`)
            
            let userW = chat.warnings[who] || []
            let index = userW.findIndex(w => w.id === warnId)
            if (index === -1) return m.reply(`❌ No existe ninguna advertencia con el ID #${warnId}.`)
            
            userW.splice(index, 1)
            chat.warnings[who] = userW
            return m.reply(`❀ Advertencia #${warnId} eliminada para @${who.split('@')[0]}`, null, { mentions: [who] })

        case 'resetwarn':
            if (!isAdmin) return m.reply('🚫 *Solo administradores.*')
            if (!who) return m.reply(`《✧》 Menciona a quien quieras limpiar de advertencias.`)
            chat.warnings[who] = []
            return m.reply(`⛊ Se han restablecido todas las advertencias para @${who.split('@')[0]}`, null, { mentions: [who] })
    }
}

// CONFIGURACIÓN DEL HANDLER (Clave para que el bot lo reconozca)
handler.help = ['warn', 'delwarn', 'warns', 'resetwarn', 'setwarnlimit'].map(v => v + ' @user')
handler.tags = ['group']
// Esta línea es la que hace que responda con cualquier prefijo:
handler.command = /^(warn|delwarn|warns|resetwarn|setwarnlimit)$/i
handler.group = true 

export default handler
