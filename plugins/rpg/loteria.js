const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const loteriaCommand = {
    name: 'loteria',
    alias: ['lotto', 'sorteo', 'ticket', 'casino'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!m.isGroup) return m.reply("⨯ La tómbola solo gira en grupos.");

        const user = await global.User.findOne({ id: m.sender });
        if (!user) return m.reply("⨯ Necesitas registrarte en el casino primero.");

        const ownerList = global.config?.owner || [];
        const isOwner = ownerList.some(owner => owner[0] + '@s.whatsapp.net' === m.sender) || m.sender === conn.user.jid;

        const ahora = Date.now();
        const cooldown = 600000;
        if (!isOwner && user.lastLoteria && (ahora - user.lastLoteria < cooldown)) {
            const mins = Math.ceil((cooldown - (ahora - user.lastLoteria)) / 60000);
            return m.reply(`⏳ La tómbola se está enfriando. Regresa en ${mins} minutos.`);
        }

        const costo = 50;
        const premioBase = Math.floor(Math.random() * 25001) + 25000;
        const probabilidadJackpot = Math.random() < 0.1;
        const jackpotFinal = probabilidadJackpot ? (premioBase * 2) : premioBase;
        const num = parseInt(args[0]);

        if (isNaN(num) || num < 1 || num > 10) {
            let menu = `『 🎰 MEGA LOTERÍA VIP 🎰 』\n\n`;
            menu += `Bienvenido al sorteo de alto riesgo. ¿Tienes un número de la suerte?\n\n`;
            menu += `🎫 *CÓMO JUGAR*\n`;
            menu += `Compite contra la casa eligiendo un número del 1 al 10.\n\n`;
            menu += `◈ Comando: *${usedPrefix}${command} <1-10>*\n`;
            menu += `◈ Costo del Boleto: *${formatCol(costo)} Col*\n`;
            menu += `◈ Premio Standard: *25.000 - 50.000 Col*\n`;
            menu += `⭐ *JACKPOT OCULTO:* ¡Pequeña probabilidad de duplicar tu premio!\n\n`;
            menu += `> "La fortuna favorece a los audaces."`;
            return m.reply(menu);
        }

        if ((user.col || 0) < costo) return m.reply(`⨯ Fondos insuficientes. Un boleto cuesta ${formatCol(costo)} Col.`);

        const name = (await conn.getName(m.sender)).toUpperCase();
        const ganador = Math.floor(Math.random() * 10) + 1;
        const gano = num === ganador;
        const gananciaReal = gano ? jackpotFinal : 0;
        const profit = gano ? (gananciaReal - costo) : -costo;

        await global.User.updateOne(
            { id: m.sender }, 
            { 
                $inc: { col: profit },
                $set: { lastLoteria: ahora }
            }
        );

        let susTxt = `『 🎟️ COMPRANDO BOLETO... 』\n\n`;
        susTxt += `👤 Jugador: ${name}\n`;
        susTxt += `💵 Inversión: -${formatCol(costo)} Col\n`;
        susTxt += `🔢 Número Elegido: [ ${num} ]\n\n`;
        susTxt += `> ⏳ Sellando boleto y girando la tómbola...`;

        await conn.sendMessage(m.chat, { text: susTxt }, { quoted: m });
        
        await new Promise(resolve => setTimeout(resolve, 2500));

        let resTxt = `『 🎰 RESULTADO DEL SORTEO 🎰 』\n\n`;
        resTxt += `👉 Tu Elección: [ ${num} ]\n`;
        resTxt += `🎯 Número Ganador: [ ${ganador} ]\n`;
        resTxt += `──────────────────\n\n`;

        if (gano) {
            if (probabilidadJackpot) {
                resTxt += `🎉 ¡🌟 MEGA JACKPOT! ¡EXPLOTASTE LA BANCA! 🌟\n`;
                resTxt += `💰 Ganancia: +${formatCol(gananciaReal)} Col\n`;
            } else {
                resTxt += `🎉 ¡FELICIDADES! ¡ACERTASTE EL NÚMERO!\n`;
                resTxt += `💰 Ganancia: +${formatCol(gananciaReal)} Col\n`;
            }
        } else {
            resTxt += `💀 LA CASA GANA. NÚMERO INCORRECTO.\n`;
            resTxt += `💸 Pérdida: -${formatCol(costo)} Col\n`;
        }

        resTxt += `──────────────────\n`;
        resTxt += `💳 Cartera Actual: ${formatCol((user.col || 0) + profit)} Col`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });

        if (gano) {
            await m.react("🤑");
        } else {
            await m.react("💀");
        }
    }
};

export default loteriaCommand;
