const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const economyCommand = {
    name: 'balance',
    alias: ['bal', 'd', 'deposit', 'depositar', 'with', 'retirar'],
    category: 'economy',
    run: async (m, { conn, args, command }) => {
        const user = await global.User.findOne({ id: m.sender });
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
                return m.reply("⨯ Ingresa una cantidad valida o usa 'all'.");
            }

            if ((user.col || 0) < depositAmount) {
                return m.reply("⨯ No tienes suficiente capital en cartera.");
            }

            const newCol = user.col - depositAmount;
            const newBank = (user.bank || 0) + depositAmount;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, bank: newBank } });

            let depTxt = "『 TRANSACCION EXITOSA 』\n\n";
            depTxt += `✦ Usuario: ${name}\n`;
            depTxt += `──────────────────\n`;
            depTxt += `◈ Depositado: ${formatCol(depositAmount)} Col\n`;
            depTxt += `◈ En Cartera: ${formatCol(newCol)} Col\n`;
            depTxt += `◈ En Banco: ${formatCol(newBank)} Col\n`;
            depTxt += `──────────────────`;
            
            return conn.sendMessage(m.chat, { text: depTxt }, { quoted: m });
        }

        if (['with', 'retirar'].includes(command)) {
            let amount = args[0];
            let withdrawAmount = 0;

            if (amount === 'all') {
                withdrawAmount = user.bank || 0;
            } else {
                withdrawAmount = parseInt(amount);
            }

            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                return m.reply("⨯ Ingresa una cantidad valida o usa 'all'.");
            }

            if ((user.bank || 0) < withdrawAmount) {
                return m.reply("⨯ No tienes suficientes fondos en el banco.");
            }

            const newCol = (user.col || 0) + withdrawAmount;
            const newBank = user.bank - withdrawAmount;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, bank: newBank } });

            let withTxt = "『 RETIRO EXITOSO 』\n\n";
            withTxt += `✦ Usuario: ${name}\n`;
            withTxt += `──────────────────\n`;
            withTxt += `◈ Retirado: ${formatCol(withdrawAmount)} Col\n`;
            withTxt += `◈ En Cartera: ${formatCol(newCol)} Col\n`;
            withTxt += `◈ En Banco: ${formatCol(newBank)} Col\n`;
            withTxt += `──────────────────`;
            
            return conn.sendMessage(m.chat, { text: withTxt }, { quoted: m });
        }

        let targetId = m.sender;
        if (m.mentionedJid && m.mentionedJid[0]) {
            targetId = m.mentionedJid[0];
        } else if (m.quoted && m.quoted.sender) {
            targetId = m.quoted.sender;
        }

        let targetUser = user;
        if (targetId !== m.sender) {
            targetUser = await global.User.findOne({ id: targetId });
            if (!targetUser) return m.reply("⨯ El usuario objetivo no tiene una cuenta registrada.");
        }

        const wallet = targetUser.col || 0;
        const bank = targetUser.bank || 0;
        const total = wallet + bank;

        const isOwnBalance = targetId === m.sender;
        const displayBank = isOwnBalance ? formatCol(bank) : "---";
        const displayTotal = isOwnBalance ? formatCol(total) : "---";

        let balTxt = "『 ESTADO DE CUENTA 』\n\n";
        balTxt += `✦ Usuario: @${targetId.split('@')[0]}\n`;
        balTxt += `──────────────────\n`;
        balTxt += `◈ Cartera: ${formatCol(wallet)} Col\n`;
        balTxt += `◈ Banco: ${displayBank} Col\n`;
        balTxt += `──────────────────\n`;
        balTxt += `◈ Total: ${displayTotal} Col\n`;
        balTxt += `──────────────────\n\n`;
        balTxt += `> Usa *.deposit* para guardar tu dinero y *.with* para retirar`;

        await conn.sendMessage(m.chat, { text: balTxt, mentions: [targetId] },  { quoted: m });
    }
};

export default economyCommand;