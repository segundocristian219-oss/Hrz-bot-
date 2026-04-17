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

                return conn.reply(chat, `*✰ Primary activado en este grupo*`, m)
            }

            if (command === 'delprimary') {
                primaryGroups.delete(chat)

                return conn.reply(chat, `*✰ Primary desactivado*`, m)
            }

        } catch (e) {
            console.error(e)
            conn.reply(m.chat, `Error`, m)
        }
    }
}

export default primaryCommand
