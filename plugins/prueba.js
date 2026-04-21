const cleanDB = {
    name: 'cleandb',
    alias: ['limpiardb', 'purgeuser'],
    category: 'admin',
    run: async (m, { conn }) => {
        const owners = [m.sender.split('@')[0], ...global.owner ? global.owner.map(o => o[0]) : []]
        if (!owners.includes(m.sender.split('@')[0])) return

        try {
            const gapMS = 3 * 24 * 60 * 60 * 1000
            const gapDate = new Date(Date.now() - gapMS)

            const queryPurga = {
                $or: [
                    { id: { $regex: /@lid$/ } },
                    { lastSeen: { $lt: gapDate } },
                    { lastSeen: { $exists: false } }
                ]
            }

            const resUsers = await global.User.deleteMany(queryPurga)

            return m.reply(`*♛ PURGA DE USUARIOS FINALIZADA ✧*\n\n` +
                           `╰❒ Registros eliminados: ${resUsers.deletedCount || 0}\n` +
                           `╰❒ Estado: Base de datos optimizada\n\n` +
                           `> Se han conservado únicamente los usuarios activos con JID legítimo (@s.whatsapp.net).`)
        } catch (e) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ No se pudo completar la limpieza de la colección de usuarios.')
        }
    }
}

export default cleanDB
