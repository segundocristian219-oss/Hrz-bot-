import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const slotCommand = {
    name: 'slot',
    alias: ['tragamonedas', 'slots', 'tragaperras', 'apostar'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            let amount = args[0];
            let currentCol = user.col || ECO_CONFIG.BASE_COL;

            if (!amount || isNaN(amount) || amount <= 0) {
                let guia = `『  VOKER CASINO  』\n\n✦ USO: ${usedPrefix + command} <cantidad>\n✧ BALANCE: ${formatCol(currentCol)} Col\n\n『 TABLA PREMIOS 』\n👑 👑 👑 ➔ Jackpot (x10)\n💎 💎 ✦ ➔ Premio (x2)\n──────────────────\n『 VOKER SYSTEMS 』`;
                return conn.reply(m.chat, guia, m);
            }

            amount = parseInt(amount);
            let now = Date.now();
            let cooldown = 300000;

            if (user.lastSlot && (now - user.lastSlot) < cooldown) {
                let s = cooldown - (now - user.lastSlot);
                let mTime = Math.floor(s / 60000);
                let sec = Math.floor((s % 60000) / 1000);
                let timeString = (mTime > 0 ? `${mTime}m ` : '') + `${sec}s`;
                return conn.reply(m.chat, `⏳ Las máquinas se están enfriando\nEspera: ${timeString}`, m);
            }

            if (currentCol < amount) {
                return conn.reply(m.chat, `✦ No tienes suficientes Col\nBalance actual: ${formatCol(currentCol)}`, m);
            }

            await m.react("🎰");

            const symbols = ["🛑", "🔔", "💎", "👑"];
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
                status = "JACKPOT LEGENDARIO";
            } else if (isWin) {
                resultCol = amount * 2;
                status = "GANANCIA MEDIA";
            } else {
                resultCol = -amount;
                status = "DERROTA";
            }

            let newCol = currentCol + resultCol;
            if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

            await global.User.updateOne(
                { id: m.sender }, 
                { $set: { col: newCol, lastSlot: now } }
            );

            const slotText = `『 VOKER CASINO 』\n\n    [ ${x[0]} | ${x[1]} | ${x[2]} ]\n\n◈ ESTADO: ${status}\n✦ RESULTADO: ${resultCol > 0 ? '+' : ''}${formatCol(resultCol)} Col\n✧ BALANCE: ${formatCol(newCol)} Col\n──────────────────\n『 VOKER SYSTEMS 』`;

            await conn.sendMessage(m.chat, { 
                text: slotText,
                contextInfo: {
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
