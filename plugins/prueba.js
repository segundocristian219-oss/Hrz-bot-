const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purge', 'clean'],
    category: 'admin',
    run: async (m, { conn }) => {
        if (!global.creadores.some(c => c[0] === m.sender.split('@')[0])) return

        try {
            const tresDiasEnMS = 3 * 24 * 60 * 60 * 1000
            const gap = new Date(Date.now() - tresDiasEnMS)

            const resUsers = await global.User.deleteMany({
                lastSeen: { $lt: gap }
            })

            const resChats = await global.Chat.deleteMany({
                $or: [
                    { lastSeen: { $lt: gap } },
                    { __v: 0, antiLink: false, nsfw: false, welcome: false, lastSeen: { $exists: false } }
                ]
            })

            const total = (resUsers.deletedCount || 0) + (resChats.deletedCount || 0)

            return m.reply(`*♛ PURGA DEL SISTEMA ✧*\n\n╰❒ Usuarios/Sesiones: ${resUsers.deletedCount || 0}\n╰❒ Grupos/Chats: ${resChats.deletedCount || 0}\n╰❒ Total: ${total}\n\n> Se eliminaron registros inactivos (3 días o más).`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Fallo al ejecutar la purga en MongoDB.')
        }
    }
}

export default cleanDB
