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
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

        const choice = (args[0] || "").toLowerCase();
        const bet = parseInt(args[1]);

        const isColor = ['rojo', 'negro'].includes(choice);
        const isParity = ['par', 'impar'].includes(choice);
        const isNumber = !isNaN(choice) && parseInt(choice) >= 0 && parseInt(choice) <= 36;

        if (!choice || (!isColor && !isParity && !isNumber) || isNaN(bet) || bet < 10) {
            let help = "『 CASINO: RULETA 』\n\n";
            help += `◈ USO: ${usedPrefix + command} [opcion] [cantidad]\n\n`;
            help += `✦ APUESTAS DISPONIBLES:\n`;
            help += `➭ Colores: rojo | negro (x2)\n`;
            help += `➭ Paridad: par | impar (x2)\n`;
            help += `➭ Numero: 1 - 36 (x36)\n`;
            help += `➭ El Cero: 0 (x50)\n\n`;
            help += `──────────────────\n`;
            help += `✦ BALANCE: ${formatCol(user.col)} Col`;
            return m.reply(help);
        }

        if (user.col < bet) return m.reply(`⨯ Fondos insuficientes. Tienes: ${formatCol(user.col)} Col`);

        const now = Date.now();
        const cooldown = 5000;
        if (now - (user.lastRt || 0) < cooldown) return m.reply(`⨯ Espera unos segundos para volver a girar.`);

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

        let resTxt = "『 R E S U L T A D O 』\n\n";
        resTxt += `✦ Giro: ${result} [ ${colorResult.toUpperCase()} ]\n`;
        resTxt += `✦ Tu Apuesta: ${choice.toUpperCase()} (${formatCol(bet)})\n`;
        resTxt += `──────────────────\n\n`;

        if (win) {
            resTxt += `『 ¡GANASTE! 』\n`;
            resTxt += `◈ Recompensa: +${formatCol(profit)} Col\n`;
        } else {
            resTxt += `『 PERDISTE 』\n`;
            resTxt += `◈ Perdida: -${formatCol(bet)} Col\n`;
        }

        resTxt += `\n✦ Saldo: ${formatCol(newCol)} Col\n──────────────────`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });
        if (win) await m.react("💰");
    }
};

export default ruletaCommand;
