const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warns', 'advertencias'],
    category: 'group',
    group: true,
    run: async (m, { conn, text, participants }) => {
        try {
            let usedPrefix = /^[./!#]/.test(m.text) ? m.text.match(/^[./!#]/)[0] : '.'
            let command = m.text.split(' ')[0].toLowerCase().replace(usedPrefix, '')

            const isAdmin = m.isGroup ? participants.find(u => u.id === m.sender)?.admin : false
            const isBotAdmin = m.isGroup ? participants.find(u => u.id === conn.user.id.split(':')[0] + '@s.whatsapp.net')?.admin : false

            if (/warns|advertencias/.test(command)) {
                let allWarns = await global.Warns.find({ groupId: m.chat })
                if (allWarns.length === 0) return conn.reply(m.chat, `*─── [ ⍰ ESTADO ] ───*\n\n_No hay usuarios advertidos en este grupo._`, m)
                
                let list = `*─── [ ⍰ USUARIOS ADVERTIDOS ] ───*\n\n`
                allWarns.forEach((w, i) => {
                    list += `*${i + 1}.* @${w.userId.split('@')[0]}\n`
                    list += `*⌬ Warns:* ${w.warnCount}/3\n`
                    list += `*᳀ Motivo:* ${w.reason}\n\n`
                })
                return conn.reply(m.chat, list, m, { mentions: allWarns.map(w => w.userId) })
            }

            if (!isAdmin) return conn.reply(m.chat, `> *🚫 ACCESO DENEGADO*\n\n_Solo administradores pueden usar este comando._`, m)

            let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
            if (!who) return conn.reply(m.chat, `> *♛ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo]`, m)

            let reason = text ? text.replace(/@(\d+)/g, '').trim() : 'Sin motivo'
            let warnDoc = await global.Warns.findOne({ userId: who, groupId: m.chat })
            if (!warnDoc) {
                warnDoc = new global.Warns({ userId: who, groupId: m.chat, warnCount: 0 })
            }

            let d = new Date()
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true })
            let date = d.toLocaleDateString('es-HN')

            if (/warn|advertir/.test(command)) {
                if (!isBotAdmin) return conn.reply(m.chat, `> *🚫 ERROR*\n\n_Necesito ser admin para ejecutar esta acción._`, m)
                
                warnDoc.warnCount += 1
                warnDoc.reason = reason
                await warnDoc.save()

                if (warnDoc.warnCount < 3) {
                    let txt = `*─── [ ▶ ADVERTENCIA ] ───*\n\n`
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`
                    txt += `*✰ Advertencias:* ${warnDoc.warnCount}/3\n`
                    txt += `*⍰ Motivo:* ${reason}\n`
                    txt += `*➠ Fecha:* ${date} | ${time}\n\n`
                    txt += `_Al llegar a 3 advertencias serás expulsado._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                } else {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat })
                    let txt = `*─── [ ×᷼× EXPULSADO ] ───*\n\n`
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`
                    txt += `*✰ Motivo final:* ${reason}\n\n`
                    txt += `_Superó el límite y el registro fue purgado._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                }
            }

            if (/delwarn|quitarwarn/.test(command)) {
                if (warnDoc.warnCount > 0) {
                    warnDoc.warnCount -= 1
                    if (warnDoc.warnCount === 0) await global.Warns.deleteOne({ userId: who, groupId: m.chat })
                    else await warnDoc.save()
                    await conn.reply(m.chat, `*♛ Advertencia removida.*\n*Estado:* ${warnDoc.warnCount}/3`, m)
                } else {
                    await conn.reply(m.chat, `*El usuario no tiene advertencias en este grupo.*`, m)
                }
            }

        } catch (e) {
            console.error(e)
        }
    }
}

export default warnCommand
