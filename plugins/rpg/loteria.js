const formatCol = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const loteriaCommand = {
    name: 'loteria',
    alias: ['lotto', 'sorteo'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        const user = await global.User.findOne({ id: m.sender });
        if (!user) return m.reply("⨯ No tienes una cuenta registrada.");

        const isOwner = [conn.user.jid, ...global.config.owner.map(o => o[0] + '@s.whatsapp.net')].includes(m.sender);

        const ahora = Date.now();
        const cooldown = 10 * 60 * 1000;
        if (!isOwner && user.lastLoteria && ahora - user.lastLoteria < cooldown) {
            const mins = Math.ceil((cooldown - (ahora - user.lastLoteria)) / 60000);
            return m.reply(`⨯ Espera ${mins} minutos para volver a jugar.`);
        }

        const num = parseInt(args[0]);
        const costo = 10000;
        const premio = Math.floor(Math.random() * (50000 - 25000 + 1)) + 25000;

        if (isNaN(num) || num < 1 || num > 10) {
            let help = "『 CASINO: LOTERIA 』\n\n";
            help += `◈ USO: ${usedPrefix + command} [1-10]\n`;
            help += `✦ COSTO: ${formatCol(costo)} Col\n`;
            help += `✦ PREMIO: 25K - 50K Col\n`;
            return m.reply(help);
        }

        if (user.col < costo) return m.reply("⨯ Fondos insuficientes.");

        const ganador = Math.floor(Math.random() * 10) + 1;
        const gano = num === ganador;
        const profit = gano ? (premio - costo) : -costo;

        await global.User.updateOne(
            { id: m.sender }, 
            { 
                $inc: { col: profit },
                $set: { lastLoteria: ahora }
            }
        );

        let txt = "『 L O T E R I A 』\n\n";
        txt += `✦ Tu Numero: ${num}\n`;
        txt += `✦ Ganador: ${ganador}\n`;
        txt += `──────────────────\n\n`;

        if (gano) {
            txt += `『 ¡GANASTE! 』\n`;
            txt += `◈ Premio: +${formatCol(premio)} Col\n`;
        } else {
            txt += `『 PERDISTE 』\n`;
            txt += `◈ Perdida: -${formatCol(costo)} Col\n`;
        }

        txt += `\n✦ Saldo: ${formatCol(user.col + profit)} Col`;

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
        if (gano) await m.react("🎟️");
    }
};

export default loteriaCommand;
