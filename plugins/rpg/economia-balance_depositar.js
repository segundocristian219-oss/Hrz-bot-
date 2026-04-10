const formatCol = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const economyCommand = {
    name: 'balance',
    alias: ['bal', 'b', 'd', 'deposit', 'depositar'],
    category: 'economy',
    run: async (m, { conn, args, command }) => {
        const user = await global.User.findOne({ id: m.sender });
        if (!user) return m.reply("⨯ No tienes una cuenta registrada.");

        const name = (await conn.getName(m.sender)).toUpperCase();
        
        if (['d', 'deposit', 'depositar'].includes(command)) {
            let amount = args[0];
            let depositAmount = 0;

            if (amount === 'all') {
                depositAmount = user.col;
            } else {
                depositAmount = parseInt(amount);
            }

            if (isNaN(depositAmount) || depositAmount <= 0) {
                return m.reply(`⨯ Ingresa una cantidad valida o usa "all".`);
            }

            if (user.col < depositAmount) {
                return m.reply("⨯ No tienes suficiente capital en cartera.");
            }

            user.col -= depositAmount;
            user.bank = (user.bank || 0) + depositAmount;
            await user.save();

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
        balTxt += `──────────────────`;

        await conn.sendMessage(m.chat, { text: balTxt }, { quoted: m });
    }
};

export default economyCommand;
              
