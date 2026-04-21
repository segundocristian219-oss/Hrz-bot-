const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purge'],
    category: 'admin',
    run: async (m, { conn }) => {
        const owners = [m.sender.split('@')[0], ...global.owner ? global.owner.map(o => o[0]) : []]
        if (!owners.includes(m.sender.split('@')[0])) return

        try {
            const gapMS = 3 * 24 * 60 * 60 * 1000
            const gapDate = new Date(Date.now() - gapMS)

            const queryLimpieza = {
                $or: [
                    { id: { $regex: /@lid$/ } },
                    { lastSeen: { $lt: gapDate } },
                    { lastSeen: { $exists: false } }
                ]
            }

            const resUsers = await global.User.deleteMany(queryLimpieza)
            const resChats = await global.Chat.deleteMany({
                $or: [
                    { id: { $regex: /@lid$/ } },
                    { lastSeen: { $lt: gapDate } },
                    { lastSeen: { $exists: false } }
                ]
            })

            const total = (resUsers.deletedCount || 0) + (resChats.deletedCount || 0)

            return m.reply(`*♛ PURGA ESTRUCTURAL ✧*\n\n╰❒ Registros eliminados: ${total}\n\n> Se eliminaron duplicados @lid y registros inactivos de 3 días.`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Error al procesar la limpieza de duplicados.')
        }
    }
}

export default cleanDB
