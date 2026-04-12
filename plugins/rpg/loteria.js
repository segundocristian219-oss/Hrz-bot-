const formatCol = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const loteriaCommand = {
    name: 'loteria',
    alias: ['lotto', 'sorteo'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        if (!isOwner) return m.reply("⨯ Comando restringido para Owners.");
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        const user = await global.User.findOne({ id: m.sender });
        if (!user) return m.reply("⨯ No tienes una cuenta registrada.");

        const numeroElegido = parseInt(args[0]);
        const costo = 500;
        const premio = 25000;

        if (isNaN(numeroElegido) || numeroElegido < 1 || numeroElegido > 10) {
            let help = "『 CASINO: LOTERIA 』\n\n";
            help += `◈ USO: ${usedPrefix + command} [1-10]\n`;
            help += `✦ COSTO: ${formatCol(costo)} Col\n`;
            help += `✦ PREMIO: ${formatCol(premio)} Col\n`;
            return m.reply(help);
        }

        if (user.col < costo) return m.reply("⨯ Fondos insuficientes.");

        const numeroGanador = Math.floor(Math.random() * 10) + 1;
        const gano = numeroElegido === numeroGanador;

        user.col -= costo;
        if (gano) user.col += premio;

        await user.save();

        let resTxt = "『 L O T E R I A 』\n\n";
        resTxt += `✦ Tu Numero: ${numeroElegido}\n`;
        resTxt += `✦ Ganador: ${numeroGanador}\n`;
        resTxt += `──────────────────\n\n`;

        if (gano) {
            resTxt += `『 ¡GANASTE! 』\n`;
            resTxt += `◈ Premio: +${formatCol(premio)} Col\n`;
        } else {
            resTxt += `『 PERDISTE 』\n`;
            resTxt += `◈ Perdida: -${formatCol(costo)} Col\n`;
        }

        resTxt += `\n✦ Saldo: ${formatCol(user.col)} Col`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });
        if (gano) await m.react("🎟️");
    }
};

export default loteriaCommand;
