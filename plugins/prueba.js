const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purge', 'clean'],
    category: 'admin',
    run: async (m, { conn }) => {
        const owners = [m.sender.split('@')[0], ...global.owner ? global.owner.map(o => o[0]) : []]
        if (!owners.includes(m.sender.split('@')[0])) return

        try {
            const gapMS = 3 * 24 * 60 * 60 * 1000
            const gapDate = new Date(Date.now() - gapMS)
            const gapNumber = Date.now() - gapMS

            const query = {
                $or: [
                    { lastSeen: { $lt: gapDate } },
                    { lastSeen: { $lt: gapNumber } },
                    { lastSeen: { $exists: false } },
                    { name: 'Sin Nombre', exp: 0 }
                ]
            }

            const resUsers = await global.User.deleteMany(query)
            const resChats = await global.Chat.deleteMany(query)

            const total = (resUsers.deletedCount || 0) + (resChats.deletedCount || 0)

            return m.reply(`*♛ PURGA PROFUNDA ✧*\n\n╰❒ Usuarios eliminados: ${resUsers.deletedCount || 0}\n╰❒ Grupos eliminados: ${resChats.deletedCount || 0}\n╰❒ Total: ${total}\n\n> Se limpiaron registros inactivos, sin fecha o corruptos.`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Fallo en la purga de MongoDB.')
        }
    }
}

export default cleanDB
