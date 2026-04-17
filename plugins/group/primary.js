const primaryGroups = global.primaryGroups || (global.primaryGroups = new Map())

const primaryCommand = {
    name: 'setprimary',
    alias: ['delprimary'],
    category: 'group',
    group: true,

    run: async (m, { conn, isROwner }) => {
        try {
            const chat = m.chat
            const botId = conn.user.id

            /* if (!isROwner) return */

            const cmd = m.command

            if (cmd === 'setprimary') {
                primaryGroups.set(chat, botId)
                return conn.reply(chat, '*✰ Primary activado*', m)
            }

            if (cmd === 'delprimary') {
                primaryGroups.delete(chat)
                return conn.reply(chat, '*✰ Primary desactivado*', m)
            }

        } catch (e) {
            console.error('PRIMARY ERROR:', e)
            return conn.reply(m.chat, 'Error', m)
        }
    }
}

export default primaryCommand
