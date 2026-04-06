const slotCommand = {
    name: 'slot',
    alias: ['tragamonedas', 'slots', 'tragaperras', 'slot'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: 0, exp: 0 });

            let amount = args[0];
            
            if (!amount || isNaN(amount) || amount <= 0) {
                let guia = `\n\t\t\t\t♛  *KIRITO CASINO* ♛\n\n`;
                guia += `✧ *USO CORRECTO:* ${usedPrefix + command} <cantidad>\n`;
                guia += `✦ *BALANCE ACTUAL:* ${user.col ?? 0} Col\n\n`;
                guia += `◈ *TABLA DE PREMIOS*\n`;
                guia += `👑 👑 👑 ➔ *Jackpot (x10)*\n`;
                guia += `🍒 🍒 ❌ ➔ *Premio Menor (x2)*\n`;
                return conn.reply(m.chat, guia, m);
            }

            amount = parseInt(amount);
            let now = Date.now();
            let cooldown = user.vip ? 15000 : 60000;

            if (user.lastSlot && (now - user.lastSlot) < cooldown) {
                let s = cooldown - (now - user.lastSlot);
                let mTime = Math.floor(s / 60000);
                let sec = Math.floor((s % 60000) / 1000);
                let timeString = (mTime > 0 ? `${mTime}m ` : '') + `${sec}s`;
                return conn.reply(m.chat, `⏳ Las máquinas se están enfriando. Espera: *${timeString}*`, m);
            }

            if ((user.col ?? 0) < amount) {
                return conn.reply(m.chat, `✦ No tienes suficientes *Col*. Tu balance es: ${user.col ?? 0}`, m);
            }

            await m.react("🎰");

            const symbols = ["🍒", "🍇", "🍋", "🔔", "💎", "👑"];
            let x = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)]
            ];

            let isJackpot = x[0] === x[1] && x[1] === x[2];
            let isWin = x[0] === x[1] || x[1] === x[2] || x[0] === x[2];
            
            let resultCol = 0;
            let status = "";

            if (isJackpot) {
                resultCol = amount * 10;
                status = "♛ ¡JACKPOT LEGENDARIO! ♛";
            } else if (isWin) {
                resultCol = amount * 2;
                status = "✧ ¡GANANCIA MEDIA! ✧";
            } else {
                resultCol = -amount;
                status = "💀 DERROTA 💀";
            }

            const newCol = (user.col ?? 0) + resultCol;
            
            await global.User.updateOne(
                { id: m.sender }, 
                { $set: { col: newCol < 0 ? 0 : newCol, lastSlot: now } }
            );

            const slotText = `
\t\t\t\t♛  *KIRITO CASINO* ♛

\t\t\t\t    [ ${x[0]} | ${x[1]} | ${x[2]} ]

◈  *ESTADO:* ${status}
✦  *RESULTADO:* ${resultCol > 0 ? '+' : ''}${resultCol} Col
✧  *BALANCE ACTUAL:* ${newCol < 0 ? 0 : newCol} Col
`;

            await conn.sendMessage(m.chat, { 
                text: slotText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    ...channelInfo
                }
            }, { quoted: m });

            if (resultCol > 0) await m.react("✅");
            else await m.react("❌");

        } catch (e) {
            console.error(e);
        }
    }
};

export default slotCommand;
