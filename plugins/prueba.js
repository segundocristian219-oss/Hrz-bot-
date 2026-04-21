const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purge', 'clean'],
    category: 'admin',
    run: async (m, { conn }) => {
        const owners = [m.sender.split('@')[0], ...global.owner ? global.owner.map(o => o[0]) : []]
        if (!owners.includes(m.sender.split('@')[0])) return

        try {
            const gap = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000))

            const resUsers = await global.User.deleteMany({
                lastSeen: { $lt: gap }
            })

            const resChats = await global.Chat.deleteMany({
                lastSeen: { $lt: gap }
            })

            const total = (resUsers.deletedCount || 0) + (resChats.deletedCount || 0)

            return m.reply(`*♛ PURGA EXITOSA ✧*\n\n╰❒ Usuarios: ${resUsers.deletedCount || 0}\n╰❒ Grupos: ${resChats.deletedCount || 0}\n╰❒ Total: ${total}\n\n> Datos inactivos de 3 días eliminados.`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Error al conectar con MongoDB.')
        }
    }
}

export default cleanDB
