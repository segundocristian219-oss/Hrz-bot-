const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warns', 'advertencias'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            let usedPrefix = /^[./!#]/.test(m.text) ? m.text.match(/^[./!#]/)[0] : '.'
            let command = m.text.split(' ')[0].toLowerCase().replace(usedPrefix, '')

            let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
            if (!who) return conn.reply(m.chat, `*⚠️ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo]`, m)

            let reason = text ? text.replace(/@(\d+)/g, '').trim() : 'Sin motivo'
            
            let warnDoc = await global.Warns.findOne({ userId: who, groupId: m.chat })
            if (!warnDoc) {
                warnDoc = new global.Warns({ userId: who, groupId: m.chat, warnCount: 0 })
            }

            let d = new Date()
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true })
            let date = d.toLocaleDateString('es-HN')

            if (/warn|advertir/.test(command)) {
                warnDoc.warnCount += 1
                warnDoc.reason = reason
                await warnDoc.save()

                if (warnDoc.warnCount < 3) {
                    let txt = `*─── [ ⚠️ ADVERTENCIA ] ───*\n\n`
                    txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                    txt += `*📉 Advertencias:* ${warnDoc.warnCount}/3\n`
                    txt += `*📝 Motivo:* ${reason}\n`
                    txt += `*📅 Fecha:* ${date} | ${time}\n\n`
                    txt += `_Al llegar a 3 advertencias serás expulsado._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                } else {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat })
                    let txt = `*─── [ 🚫 EXPULSADO ] ───*\n\n`
                    txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                    txt += `*📝 Motivo final:* ${reason}\n\n`
                    txt += `_Superó el límite de advertencias._`
                    await conn.reply(m.chat, txt, m, { mentions: [who] })
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                }
            }

            if (/delwarn|quitarwarn/.test(command)) {
                if (warnDoc.warnCount > 0) {
                    warnDoc.warnCount -= 1
                    await warnDoc.save()
                    await conn.reply(m.chat, `*✅ Advertencia removida.*\n*Estado:* ${warnDoc.warnCount}/3`, m)
                } else {
                    await conn.reply(m.chat, `*El usuario no tiene advertencias en este grupo.*`, m)
                }
            }

            if (/warns|advertencias/.test(command)) {
                let txt = `*─── [ 📊 ESTADO ] ───*\n\n`
                txt += `*👤 Usuario:* @${who.split`@`[0]}\n`
                txt += `*📉 Warns:* ${warnDoc.warnCount}/3\n`
                txt += `*📝 Último motivo:* ${warnDoc.reason}`
                await conn.reply(m.chat, txt, m, { mentions: [who] })
            }

        } catch (e) {
            console.error(e)
        }
    }
}

export default warnCommand
