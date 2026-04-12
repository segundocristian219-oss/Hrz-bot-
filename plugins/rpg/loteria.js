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

        const owners = [conn.user.jid, ...global.config.owner.map(owner => owner[0] + '@s.whatsapp.net')];
        const isOwner = owners.includes(m.sender);

        const ahora = Date.now();
        const tiempoCooldown = 10 * 60 * 1000;
        if (!isOwner && user.lastLoteria && ahora - user.lastLoteria < tiempoCooldown) {
            const restante = Math.ceil((tiempoCooldown - (ahora - user.lastLoteria)) / 60000);
            return m.reply(`⨯ Espera ${restante} minutos para volver a jugar.`);
        }

        const numeroElegido = parseInt(args[0]);
        const costo = 10000;
        const premio = Math.floor(Math.random() * (50000 - 25000 + 1)) + 25000;

        if (isNaN(numeroElegido) || numeroElegido < 1 || numeroElegido > 10) {
            let help = "『 CASINO: LOTERIA 』\n\n";
            help += `◈ USO: ${usedPrefix + command} [1-10]\n`;
            help += `✦ COSTO: ${formatCol(costo)} Col\n`;
            help += `✦ PREMIO: 25K - 50K Col\n`;
            return m.reply(help);
        }

        if (user.col < costo) return m.reply("⨯ Fondos insuficientes.");

        const numeroGanador = Math.floor(Math.random() * 10) + 1;
        const gano = numeroElegido === numeroGanador;
        const profit = gano ? (premio - costo) : -costo;

        await global.User.updateOne(
            { id: m.sender }, 
            { 
                $inc: { col: profit },
                $set: { lastLoteria: ahora }
            }
        );

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

        resTxt += `\n✦ Saldo: ${formatCol(user.col + profit)} Col`;

        await conn.sendMessage(m.chat, { text: resTxt }, { quoted: m });
        if (gano) await m.react("🎟️");
    }
};

export default loteriaCommand;
