const primaryGroups = global.primaryGroups || (global.primaryGroups = new Map())

const primaryCommand = {
    name: 'setprimary',
    alias: ['delprimary'],
    category: 'group',
    group: true,

    run: async (m, { conn, command, isROwner }) => {
        try {
            const chat = m.chat
            const botId = conn.user.id

            /* if (!isROwner) return */

            if (command === 'setprimary') {
                primaryGroups.set(chat, botId)

                let txt = `*─── [ ♛ PRIMARY ] ───*\n\n`
                txt += `*✰ Estado:* Activado\n`
                txt += `*➠ Bot:* Este subbot ahora es el principal\n\n`

                return conn.reply(chat, txt, m)
            }

            if (command === 'delprimary') {
                primaryGroups.delete(chat)

                let txt = `*─── [ ♛ PRIMARY ] ───*\n\n`
                txt += `*✰ Estado:* Desactivado\n`
                txt += `*➠ Modo:* Todos los bots responderán\n\n`

                return conn.reply(chat, txt, m)
            }

        } catch (e) {
            console.error(e)
            conn.reply(m.chat, `> ❌ *_Error en primary._*`, m)
        }
    },

    before: async (m, { conn }) => {
        const chat = m.chat
        const botId = conn.user.id

        const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim()
        const prefixes = ['#', '.', '/', '!']
        const usedPrefix = prefixes.find(p => msgText.startsWith(p))

        if (usedPrefix) {
            const cmd = msgText.slice(usedPrefix.length).split(/\s+/)[0].toLowerCase()
            if (cmd === 'setprimary' || cmd === 'delprimary') return false
        }

        if (!primaryGroups.has(chat)) return false

        const primary = primaryGroups.get(chat)

        if (primary !== botId) return true
        return false
    }
}

export default primaryCommand
