const slotCommand = {
    name: 'slot',
    alias: ['apostar', 'slot', 'suerte'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        let user = await global.User.findOne({ id: m.sender })
        if (!user) user = await global.User.create({ id: m.sender, col: 10, exp: 0 })

        let amount = args[0]
        if (!amount || isNaN(amount) || amount <= 0) {
            return conn.reply(m.chat, `✧ *USO CORRECTO:* ${usedPrefix + command} <cantidad>`, m)
        }

        amount = parseInt(amount)
        if (user.col < amount) {
            return conn.reply(m.chat, `✦ No tienes suficientes *Col*. Tu balance es: ${user.col ?? 0}`, m)
        }

        await m.react("🎰")

        const symbols = ['💎', '✨', '🪙', '🔥', '💀']
        let x = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ]

        let isWin = x[0] === x[1] && x[1] === x[2]
        let isSemiWin = x[0] === x[1] || x[1] === x[2] || x[0] === x[2]
        
        let resultCol = 0
        let status = ""

        if (isWin) {
            resultCol = amount * 3
            status = "♛ ¡VICTORIA LEGENDARIA! ♛"
        } else if (isSemiWin) {
            resultCol = Math.floor(amount * 1.5)
            status = "✧ ¡GANANCIA MEDIA! ✧"
        } else {
            resultCol = -amount
            status = "💀 DERROTA 💀"
        }

        const newCol = (user.col ?? 0) + resultCol
        await global.User.updateOne({ id: m.sender }, { $set: { col: newCol < 0 ? 0 : newCol } })

        const slotText = `
\t\t\t\t♛  *KIRITO CASINO* ♛

\t\t\t\t    [ ${x[0]} | ${x[1]} | ${x[2]} ]

◈  *ESTADO:* ${status}
✦  *RESULTADO:* ${resultCol > 0 ? '+' : ''}${resultCol} Col
✧  *BALANCE ACTUAL:* ${newCol < 0 ? 0 : newCol} Col

`

        await conn.sendMessage(m.chat, { 
            text: slotText,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                ...channelInfo
            }
        }, { quoted: m })

        if (resultCol > 0) await m.react("✅")
        else await m.react("❌")
    }
}

export default slotCommand
