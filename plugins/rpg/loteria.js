import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const loteriaCommand = {
    name: 'loteria',
    alias: ['lotto', 'sorteo', 'ticket', 'casino'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!m.isGroup) return m.reply("⨯ La tómbola solo gira en grupos.");

        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

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
            let menu = `『 🎰 MEGA LOTERÍA 🎰 』\n\n`;
            menu += `🎫 CÓMO JUGAR\n`;
            menu += `Elige un número del 1 al 10.\n\n`;
            menu += `◈ Comando: ${usedPrefix + command} <1-10>\n`;
            menu += `◈ Costo: ${formatCol(costo)} Col\n`;
            menu += `◈ Premio: 25.000 - 50.000 Col\n\n`;
            menu += `✦ BALANCE: ${formatCol(user.col)} Col\n──────────────────`;
            return m.reply(menu);
        }

        if ((user.col || 0) < costo) return m.reply(`⨯ Fondos insuficientes. El boleto cuesta ${formatCol(costo)} Col.`);

        const name = (await conn.getName(m.sender)).toUpperCase();
        const ganador = Math.floor(Math.random() * 10) + 1;
        const gano = num === ganador;
        
        let newCol = (user.col || ECO_CONFIG.BASE_COL) - costo;
        if (gano) newCol += jackpotFinal;
        
        if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

        await global.User.updateOne(
            { id: m.sender }, 
            { 
                $set: { col: newCol, lastLoteria: ahora }
            }
        );

        let susTxt = `『 🎟️ BOLETO SELLADO 』\n\n👤 Jugador: ${name}\n🔢 Número: [ ${num} ]\n\n> Girando la tómbola...`;
        await conn.sendMessage(m.chat, { text: susTxt }, { quoted: m });

        await new Promise(resolve => setTimeout(resolve, 2500));

        let resTxt = `『 RESULTADO SORTEO 』\n\n`;
        resTxt += `✦ Tu Número: [ ${num} ]\n`;
        resTxt += `🎯 Ganador: [ ${ganador} ]\n`;
        resTxt += `──────────────────\n\n`;

        if (gano) {
            resTxt += probabilidadJackpot ? `🎉 ¡MEGA JACKPOT! 🎉\n` : `🎉 ¡ACERTASTE! 🎉\n`;
            resTxt += `💰 Ganancia: +${formatCol(jackpotFinal)} Col\n`;
        } else {
            resTxt += `💀 PERDISTE\n`;
            resTxt += `💸 Costo: -${formatCol(costo)} Col\n`;
        }

        resTxt += `\n✧ Balance: ${formatCol(newCol)} Col\n──────────────────`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });
        await m.react(gano ? "🤑" : "💀");
    }
};

export default loteriaCommand;
