const primaryGroups = global.primaryGroups || (global.primaryGroups = new Map())

const primaryCommand = {
    name: 'setprimary',
    alias: ['delprimary'],
    category: 'group',
    group: true,

    run: async (m, { conn }) => {
        try {
            const chat = m.chat
            const botId = conn.user.jid
            const text = m.text || ''

            /* 
            const sender = m.sender.split('@')[0]
            const isOwner = global.owner.some(([num]) => sender.includes(num))
            if (!isOwner) return 
            */

            if (text.startsWith('.setprimary')) {
                primaryGroups.set(chat, botId)

                let txt = `*─── [ ♛ PRIMARY ] ───*\n\n`
                txt += `*✰ Estado:* Activado\n`
                txt += `*➠ Bot:* Este subbot ahora es el principal\n\n`

                return conn.reply(chat, txt, m)
            }

            if (text.startsWith('.delprimary')) {
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
        const botId = conn.user.jid

        if (!primaryGroups.has(chat)) return

        const primary = primaryGroups.get(chat)

        if (primary !== botId) return false
    }
}

export default primaryCommand
