import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = { BASE_COL: 1000 };
const formatCol = (num) => Number(num).toLocaleString('de-DE');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slotCommand = {
    name: 'slot',
    alias: ['tragamonedas', 'slots', 'tragaperras', 'apostar'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {

            /*
            const ownerList = global.owner || global.config?.owner || [];
            const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

            if (!checkOwner) {
                return conn.reply(m.chat, `✦ Este comando todavía no está disponible para la versión *6.0.1*.\n✧ Por favor, espera la nueva actualización *6.0.2* para poder usarlo. ✨`, m);
            }
            */

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            let amount = args[0];
            let currentCol = user.col || ECO_CONFIG.BASE_COL;

            if (!amount || isNaN(amount) || amount <= 0) {
                let guia = `『 🎰 CASINO DE KIRITO 』\n\n✦ *USO:* ${usedPrefix + command} <cantidad>\n✧ *TU BOLSA:* ${formatCol(currentCol)} Col\n\n『 TABLA DE RECOMPENSAS 』\n👑 👑 👑 ➔ Jackpot (x10)\n💎 💎 ✦ ➔ Ganancia Táctica (x2)\n\n*¿Tienes el valor para desafiar a la suerte?*`;
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
                return conn.reply(m.chat, `⏳ *Las máquinas necesitan enfriarse antes de otra tirada*.\nEspera: *${timeString}*`, m);
            }

            if (currentCol < amount) {
                return conn.reply(m.chat, `💸 *Fondos insuficientes*\n\n✧ Dinero actual: ${formatCol(currentCol)} Col`, m);
            }

            await m.react("🎰");

            const symbols = ["💀", "🔔", "💎", "👑", "🌠"];
            let x = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)]
            ];

            let isJackpot = x[0] === x[1] && x[1] === x[2];
            let isWin = x[0] === x[1] || x[1] === x[2] || x[0] === x[2];

            let resultCol = 0;
            let status = "";
            let emotionText = "";

            if (isJackpot) {
                resultCol = amount * 10;
                status = "JACKPOT";
                emotionText = "¡Has ganado el premio mayor!";
            } else if (isWin) {
                resultCol = amount * 2;
                status = "GANANCIA";
                emotionText = "Buena jugada, sigues en racha.";
            } else {
                resultCol = -amount;
                status = "DERROTA";
                emotionText = "La máquina gana esta vez...";
            }

            let newCol = currentCol + resultCol;
            if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, lastSlot: now } });

            const { key } = await conn.sendMessage(m.chat, { 
                text: `『 🎰 CASINO 』\n\n[ 🌀 | 🌀 | 🌀 ]\n\nApostando: ${formatCol(amount)} Col...`
            }, { quoted: m });

            await delay(1000);
            await conn.sendMessage(m.chat, { text: `『 🎰 CASINO 』\n\n[ ${x[0]} | 🌀 | 🌀 ]`, edit: key });

            await delay(1000);
            await conn.sendMessage(m.chat, { text: `『 🎰 CASINO 』\n\n[ ${x[0]} | ${x[1]} | 🌀 ]`, edit: key });

            await delay(1200); 

            const finalSlotText = `『 🎰 CASINO 』\n\n[ ${x[0]} | ${x[1]} | ${x[2]} ]\n\nEstado: ${status}\nResultado: ${resultCol > 0 ? '+' : ''}${formatCol(resultCol)} Col\nBalance: ${formatCol(newCol)} Col\n\n${emotionText}`;

            await conn.sendMessage(m.chat, { text: finalSlotText, edit: key });

            if (isJackpot) await m.react("🌟");
            else if (isWin) await m.react("✅");
            else await m.react("❌");

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default slotCommand;
