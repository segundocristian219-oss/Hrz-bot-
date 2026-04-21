const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purge', 'clean'],
    category: 'admin',
    run: async (m, { conn }) => {
        if (!global.creadores.some(c => c[0] === m.sender.split('@')[0])) return

        try {
            const gap = Date.now() - (3 * 24 * 60 * 60 * 1000)

            const resSessions = await global.db.sessions.deleteMany({
                lastSeen: { $lt: gap }
            })

            const resGroups = await global.db.groups.deleteMany({
                lastUpdate: { $lt: gap }
            })

            const total = (resSessions.deletedCount || 0) + (resGroups.deletedCount || 0)

            return m.reply(`*♛ PURGA EXITOSA ✧*\n\n╰❒ Sesiones: ${resSessions.deletedCount || 0}\n╰❒ Grupos: ${resGroups.deletedCount || 0}\n╰❒ Total: ${total}\n\n> Registros inactivos de 3 días eliminados.`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Fallo en la limpieza de datos.')
        }
    }
}

export default cleanDB
