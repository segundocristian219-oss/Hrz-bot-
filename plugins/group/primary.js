const primaryGroups = global.primaryGroups || (global.primaryGroups = new Map())

export default {
    name: 'setprimary',
    alias: ['delprimary'],
    category: 'group',
    group: true,

    run: async (m, { conn, isROwner }) => {
        try {
            const chat = m.chat
            const botId = conn.user?.id

            /* if (!isROwner) return */

            if (!botId) throw 'Bot no detectado'

            if (m.command === 'setprimary') {
                primaryGroups.set(chat, botId)

                return conn.sendMessage(m.chat, {
                    text: '✰ Este subbot ahora es el PRIMARY'
                }, { quoted: m })
            }

            if (m.command === 'delprimary') {
                primaryGroups.delete(chat)

                return conn.sendMessage(m.chat, {
                    text: '✰ Primary desactivado'
                }, { quoted: m })
            }

        } catch (e) {
            console.error(e)
            return conn.sendMessage(m.chat, {
                text: 'Error'
            }, { quoted: m })
        }
    }
}
