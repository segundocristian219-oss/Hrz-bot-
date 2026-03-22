const workCommand = {
    name: 'work',
    alias: ['trabajar', 'chamba', 'chambear'],
    category: 'rpg',
    run: async (m, { conn, usedPrefix, command }) => {
        let user = await global.User.findOne({ id: m.sender })
        if (!user) user = await global.User.create({ id: m.sender, col: 10, exp: 0 })

        const now = Date.now()
        const cooldown = 5 * 60 * 1000 // 5 minutos de espera
        const lastWork = user.lastWork || 0

        if (now - lastWork < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000)
            const mins = Math.floor(remaining / 60)
            const secs = remaining % 60
            return conn.reply(m.chat, `⚠️ *ESTÁS AGOTADO*\n\nDebes descansar. Regresa en: *${mins}m ${secs}s*`, m)
        }

        await m.react("🛠️")

        // Lista de trabajos con pagos mínimos y realistas (entre 10 y 45 Col)
        const empleos = [
            { t: "Limpiaste la base de datos de VOKER VX", p: [15, 30] },
            { t: "Reparaste un bug en el Handler", p: [20, 45] },
            { t: "Configuraste un link en DIX.LAT", p: [10, 25] },
            { t: "Moderaste el grupo oficial", p: [12, 28] },
            { t: "Optimizaste el consumo de RAM del bot", p: [25, 40] },
            { t: "Actualizaste los comandos de RPG", p: [18, 35] }
        ]

        const job = empleos[Math.floor(Math.random() * empleos.length)]
        const pago = Math.floor(Math.random() * (job.p[1] - job.p[0] + 1)) + job.p[0]

        const newCol = (user.col ?? 0) + pago
        
        // Actualizamos las monedas y guardamos la hora del último trabajo
        await global.User.updateOne(
            { id: m.sender }, 
            { $set: { col: newCol, lastWork: now } }
        )

        const workText = `
\t\t\t\t♛  *HAS TRABAJADO* ♛

◈  *TRABAJO:* ${job.t}
✦  *PAGO:* +${pago} Col
✧  *BALANCE:* ${newCol} Col

`

        await conn.sendMessage(m.chat, { 
            text: workText,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.ch || "120363000000000000@newsletter", 
                    serverMessageId: 101,
                    newsletterName: name()
                }
            }
        }, { quoted: m })

        await m.react("✅")
    }
}

export default workCommand
