import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const ruletaCommand = {
    name: 'ruleta',
    alias: ['rt', 'roulette'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {

        /*
        const ownerList = global.owner || global.config?.owner || [];
        const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

        if (!checkOwner) {
            return m.reply("Este comando aún no está disponible.");
        }
        */

        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

        const choice = (args[0] || "").toLowerCase();
        const bet = parseInt(args[1]);

        const isColor = ['rojo', 'negro'].includes(choice);
        const isParity = ['par', 'impar'].includes(choice);
        const isNumber = !isNaN(choice) && parseInt(choice) >= 0 && parseInt(choice) <= 36;

        if (!choice || (!isColor && !isParity && !isNumber) || isNaN(bet) || bet < 10) {
            let help = "『 RULETA 』\n\n";
            help += `Uso: ${usedPrefix + command} [opcion] [cantidad]\n\n`;
            help += `Apuestas:\n`;
            help += `• rojo | negro (x2)\n`;
            help += `• par | impar (x2)\n`;
            help += `• numero 1-36 (x36)\n`;
            help += `• 0 (x50)\n\n`;
            help += `Balance: ${formatCol(user.col)} Col`;
            return m.reply(help);
        }

        if (user.col < bet) {
            return m.reply(`⨯ Fondos insuficientes\nSaldo: ${formatCol(user.col)} Col`);
        }

        const now = Date.now();
        const cooldown = 5000;

        if (now - (user.lastRt || 0) < cooldown) {
            return m.reply(`⨯ Espera unos segundos para volver a jugar.`);
        }

        const result = Math.floor(Math.random() * 37);

        let colorResult = result === 0 ? 'verde' : (result % 2 === 0 ? 'negro' : 'rojo');
        let parityResult = result === 0 ? 'ninguno' : (result % 2 === 0 ? 'par' : 'impar');

        let win = false;
        let multiplier = 0;

        if (isColor && choice === colorResult) {
            win = true;
            multiplier = 2;
        } else if (isParity && choice === parityResult) {
            win = true;
            multiplier = 2;
        } else if (isNumber && parseInt(choice) === result) {
            win = true;
            multiplier = result === 0 ? 50 : 36;
        }

        let newCol = user.col - bet;
        let profit = 0;

        if (win) {
            profit = bet * multiplier;
            newCol += profit;
        }

        if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

        await global.User.updateOne(
            { id: m.sender },
            { $set: { col: newCol, lastRt: now } }
        );

        let resTxt = "『 RESULTADO RULETA 』\n\n";
        resTxt += `• Giro: ${result} [ ${colorResult.toUpperCase()} ]\n`;
        resTxt += `• Apuesta: ${choice.toUpperCase()} (${formatCol(bet)})\n`;
        resTxt += `──────────────\n\n`;

        if (win) {
            resTxt += `GANASTE\n`;
            resTxt += `+${formatCol(profit)} Col\n`;
        } else {
            resTxt += `PERDISTE\n`;
            resTxt += `-${formatCol(bet)} Col\n`;
        }

        resTxt += `\nSaldo: ${formatCol(newCol)} Col`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });

        if (win) await m.react("💰");
        else await m.react("❌");
    }
};

export default ruletaCommand;
