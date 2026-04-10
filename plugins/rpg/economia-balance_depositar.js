const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const economyCommand = {
    name: 'balance',
    alias: ['bal', 'b', 'd', 'deposit', 'depositar'],
    category: 'economy',
    run: async (m, { conn, args, command }) => {
        const user = global.db.data.users[m.sender];
        if (!user) return m.reply("⨯ No tienes una cuenta registrada.");

        const name = (await conn.getName(m.sender)).toUpperCase();
        
        if (['d', 'deposit', 'depositar'].includes(command)) {
            let amount = args[0];
            let depositAmount = 0;

            if (amount === 'all') {
                depositAmount = user.col || 0;
            } else {
                depositAmount = parseInt(amount);
            }

            if (isNaN(depositAmount) || depositAmount <= 0) {
                return m.reply(`⨯ Ingresa una cantidad valida o usa "all".`);
            }

            if ((user.col || 0) < depositAmount) {
                return m.reply("⨯ No tienes suficiente capital en cartera.");
            }

            user.col -= depositAmount;
            user.bank = (user.bank || 0) + depositAmount;

            let depTxt = "『 TRANSACCION EXITOSA 』\n\n";
            depTxt += `✦ Usuario: ${name}\n`;
            depTxt += `──────────────────\n`;
            depTxt += `◈ Depositado: ${formatCol(depositAmount)} Col\n`;
            depTxt += `◈ En Cartera: ${formatCol(user.col)} Col\n`;
            depTxt += `◈ En Banco: ${formatCol(user.bank)} Col\n`;
            depTxt += `──────────────────`;
            
            return conn.sendMessage(m.chat, { text: depTxt }, { quoted: m });
        }

        const wallet = user.col || 0;
        const bank = user.bank || 0;
        const total = wallet + bank;

        let balTxt = "『 ESTADO DE CUENTA 』\n\n";
        balTxt += `✦ Usuario: ${name}\n`;
        balTxt += `──────────────────\n`;
        balTxt += `◈ Cartera: ${formatCol(wallet)} Col\n`;
        balTxt += `◈ Banco: ${formatCol(bank)} Col\n`;
        balTxt += `──────────────────\n`;
        balTxt += `◈ Total: ${formatCol(total)} Col\n`;
        balTxt += `──────────────────\n\n`;
        balTxt += `✦ usa .deposit para guardar tu dinero en el banco`;

        await conn.sendMessage(m.chat, { text: balTxt }, { quoted: m });
    }
};

export default economyCommand;
