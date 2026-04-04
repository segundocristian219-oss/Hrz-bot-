const workCommand = {
    name: 'work',
    alias: ['trabajar', 'chamba', 'chambear'],
    category: 'rpg',
    run: async (m, { conn, usedPrefix, command }) => {
        let user = await global.User.findOne({ id: m.sender })
        if (!user) user = await global.User.create({ id: m.sender, col: 10, exp: 0 })

        const now = Date.now()
        const cooldown = 10 * 60 * 1000 
        const lastWork = user.lastWork || 0

        if (now - lastWork < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000)
            const mins = Math.floor(remaining / 60)
            const secs = remaining % 60
            return conn.reply(m.chat, `⌛ *DESCANSO NECESARIO*\n\nHas trabajado mucho. Regresa en: *${mins}m ${secs}s*`, m)
        }

        await m.react("💪")

        
        const empleos = [
            { t: "Ayudaste a un anciano a acomodar cajas en su tienda", p: [8, 13, 17] },
            { t: "Cuidaste el huerto de un vecino durante la mañana", p: [6, 9] },
            { t: "Repartiste volantes de la panadería local", p: [17, 20] },
            { t: "Limpiaste los establos en la granja del pueblo", p: [22, 20] },
            { t: "Recogiste leña seca en el campo para el invierno", p: [7, 9] },
            { t: "Ayudaste a cargar bultos de café en el mercado", p: [29, 25] },
            { t: "Limpiaste los vidrios de una oficina pequeña", p: [10, 15] }
        ]

        const job = empleos[Math.floor(Math.random() * empleos.length)]
        const pago = Math.floor(Math.random() * (job.p[1] - job.p[0] + 1)) + job.p[0]

        const newCol = (user.col ?? 0) + pago

        await global.User.updateOne(
            { id: m.sender }, 
            { $set: { col: newCol, lastWork: now } }
        )

        const workText = `
\t\t\t\t♛  *JORNADA LABORAL* ♛

◈  *ACTIVIDAD:* ${job.t}
✦  *PAGO:* +${pago} Col
✧  *BALANCE:* ${newCol} Col

`

        await conn.sendMessage(m.chat, { 
            text: workText,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                ...channelInfo
            }
        }, { quoted: m })

        await m.react("✅")
    }
}

export default workCommand
