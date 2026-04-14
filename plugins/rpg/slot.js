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
            const ownerList = global.owner || global.config?.owner || [];
            const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

            if (!checkOwner) {
                return conn.reply(m.chat, `✦ Este comando todavía no está disponible para la versión *6.0.1*.\n✧ Por favor, espera la nueva actualización *6.0.2* para poder usarlo. ✨`, m);
            }

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            let amount = args[0];
            let currentCol = user.col || ECO_CONFIG.BASE_COL;

            if (!amount || isNaN(amount) || amount <= 0) {
                let guia = `『 🎰 CASINO IMPERIAL DE KIRITO 』\n\n✦ *USO:* ${usedPrefix + command} <cantidad>\n✧ *TU BOLSA:* ${formatCol(currentCol)} Col\n\n『 TABLA DE RECOMPENSAS 』\n👑 👑 👑 ➔ Jackpot Divino (x10)\n💎 💎 ✦ ➔ Ganancia Táctica (x2)\n\n*¿Tienes el valor para desafiar a la suerte?*`;
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
                return conn.reply(m.chat, `⏳ *¡Los engranajes están ardiendo!*\n\nLas máquinas necesitan enfriarse antes de otra tirada épica.\nPor favor, espera: *${timeString}*`, m);
            }

            if (currentCol < amount) {
                return conn.reply(m.chat, `💸 *¡Fondos insuficientes!*\n\nTu bolsa se siente demasiado ligera... Intenta apostar una cantidad menor o consigue más recursos.\n✧ *Bolsa actual:* ${formatCol(currentCol)} Col`, m);
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
                status = "🌟 JACKPOT DIVINO 🌟";
                emotionText = "¡EL CIELO RETUMBA! ¡Has vaciado las bóvedas del casino!";
            } else if (isWin) {
                resultCol = amount * 2;
                status = "✨ GANANCIA MEDIA ✨";
                emotionText = "¡La suerte te sonríe! Una victoria digna de un guerrero.";
            } else {
                resultCol = -amount;
                status = "🌑 DERROTA ABSOLUTA 🌑";
                emotionText = "Las sombras reclaman tu apuesta... La máquina te ha devorado sin piedad.";
            }

            let newCol = currentCol + resultCol;
            if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, lastSlot: now } });

            const { key } = await conn.sendMessage(m.chat, { 
                text: `『 🎰 CASINO IMPERIAL 』\n\n    [ 🌀 | 🌀 | 🌀 ]\n\n*Apostando:* ${formatCol(amount)} Col...\n*Tirando de la palanca con fuerza...*`
            }, { quoted: m });

            await delay(1000);
            await conn.sendMessage(m.chat, { text: `『 🎰 CASINO IMPERIAL 』\n\n    [ ${x[0]} | 🌀 | 🌀 ]\n\n*El primer rodillo se detiene...*`, edit: key });

            await delay(1000);
            await conn.sendMessage(m.chat, { text: `『 🎰 CASINO IMPERIAL 』\n\n    [ ${x[0]} | ${x[1]} | 🌀 ]\n\n*El corazón te late a mil por hora...*`, edit: key });

            await delay(1200); 

            const finalSlotText = `『 🎰 CASINO IMPERIAL 』\n\n    [ ${x[0]} | ${x[1]} | ${x[2]} ]\n\n◈ *ESTADO:* ${status}\n✦ *RESULTADO:* ${resultCol > 0 ? '+' : ''}${formatCol(resultCol)} Col\n✧ *NUEVO BALANCE:* ${formatCol(newCol)} Col\n\n> _${emotionText}_`;

            const msgContext = typeof channelInfo !== 'undefined' ? { contextInfo: { ...channelInfo } } : {};
            await conn.sendMessage(m.chat, { text: finalSlotText, edit: key, ...msgContext });

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
