const slotCommand = {
    name: 'slot2',
    alias: ['tragaperras', 'tragamonedas', 'slot2'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            let user = global.users[m.sender];
            if (!user) {
                global.users[m.sender] = { monedas: 0, xp: 0 };
                user = global.users[m.sender];
            }

            let apuesta = parseInt(args[0]);

            if (!apuesta || isNaN(apuesta) || apuesta <= 0) {
                let guia = `*─── [ 🎰 CASINO ROYALE ] ───*\n\n`;
                guia += `*💡 Uso:* ${usedPrefix + command} <cantidad>\n`;
                guia += `*💳 Tu Saldo:* ${(user.monedas || 0).toLocaleString()} Monedas\n\n`;
                guia += `*🏆 T A B L A   D E   P R E M I O S*\n`;
                guia += `👑 👑 👑 ➔ *Jackpot (x10)*\n`;
                guia += `🍒 🍒 ❌ ➔ *Premio Menor (x2)*\n`;
                guia += `*────────────────────*`;
                return conn.reply(m.chat, guia, m);
            }

            let now = Date.now();
            let cooldown = user.vip ? 15000 : 60000;

            if (user.lastSlot && (now - user.lastSlot) < cooldown) {
                let s = cooldown - (now - user.lastSlot);
                let mTime = Math.floor(s / 60000);
                let sec = Math.floor((s % 60000) / 1000);
                let timeString = (mTime > 0 ? `${mTime}m ` : '') + `${sec}s`;
                return conn.reply(m.chat, `*─── [ ⏳ COOLDOWN ] ───*\n\n_Las máquinas se están enfriando._\n_⏱️ Espera: *${timeString}*_`, m);
            }

            if ((user.monedas || 0) < apuesta) {
                return conn.reply(m.chat, `*─── [ ❌ FONDOS ] ───*\n\n_Fondos insuficientes. Tienes *${(user.monedas || 0).toLocaleString()}* Monedas._`, m);
            }

            user.monedas -= apuesta;
            user.lastSlot = now;

            const emojis = ["🍒", "🍇", "🍋", "🔔", "💎", "👑"];
            let a = emojis[Math.floor(Math.random() * emojis.length)];
            let b = emojis[Math.floor(Math.random() * emojis.length)];
            let c = emojis[Math.floor(Math.random() * emojis.length)];

            let visual = `*─── [ 🎰 SLOT MACHINE ] ───*\n\n`;
            visual += `       ➤ [ ${a} | ${b} | ${c} ] ⮜\n\n`;

            if (a === b && b === c) {
                let ganancia = apuesta * 10;
                user.monedas += ganancia;
                visual += `*🎊 ¡ J A C K P O T ! 🎊*\n`;
                visual += `*📈 Ganaste:* +${ganancia.toLocaleString()} Monedas\n`;
            } else if (a === b || b === c || a === c) {
                let ganancia = apuesta * 2;
                user.monedas += ganancia;
                visual += `*✨ ¡ B U E N A   S U E R T E ! ✨*\n`;
                visual += `*🪙 Ganaste:* +${ganancia.toLocaleString()} Monedas\n`;
            } else {
                visual += `*💀 ¡ P É R D I D A ! 💀*\n`;
                visual += `*📉 Perdiste:* -${apuesta.toLocaleString()} Monedas\n`;
            }

            if (user.monedas < 0) user.monedas = 0;

            visual += `\n*💳 Nuevo Saldo:* ${user.monedas.toLocaleString()}\n`;
            visual += `*────────────────────*`;

            await conn.reply(m.chat, visual, m);

        } catch (e) {
            console.error(e);
        }
    }
};

export default slotCommand;
                
