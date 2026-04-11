const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const payCommand = {
    name: 'pay',
    alias: ['pagar', 'transferir', 'transfer'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
            let amount = args.find(a => !isNaN(a) && !a.includes('@'));
            amount = parseInt(amount);

            if (!who || isNaN(amount) || amount <= 0) {
                let txt = `『 ✦ SISTEMA BANCARIO ✦ 』\n\n`;
                txt += `◈ Uso: ${usedPrefix + command} <cantidad> [@usuario / responder]\n`;
                txt += `◈ Ejemplo: ${usedPrefix + command} 1500 @usuario\n`;
                return conn.reply(m.chat, txt, m);
            }

            if (who === m.sender) return m.reply("⨯ Operacion rechazada: No puedes transferir fondos a ti mismo.");

            let senderUser = await global.User.findOne({ id: m.sender });
            if (!senderUser) return m.reply("⨯ No tienes una cuenta registrada.");

            const currentBank = senderUser.bank || 0;

            if (currentBank < amount) {
                return m.reply(`⨯ Fondos insuficientes.\n◈ Tu saldo bancario es de: ${formatCol(currentBank)} Col.`);
            }

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, bank: 0 });

            await global.User.updateOne({ id: m.sender }, { $inc: { bank: -amount } });
            await global.User.updateOne({ id: who }, { $inc: { bank: amount } });

            const txt = `『 ✦ TRANSFERENCIA EXITOSA ✦ 』\n\n` +
                        `◈ Remitente: @${m.sender.split('@')[0]}\n` +
                        `◈ Destinatario: @${who.split('@')[0]}\n` +
                        `◈ Monto Transferido: ${formatCol(amount)} Col\n` +
                        `──────────────────\n` +
                        `✦ Tu nuevo balance: ${formatCol(currentBank - amount)} Col\n` +
                        `──────────────────`;

            await conn.sendMessage(m.chat, { 
                text: txt, 
                mentions: [m.sender, who],
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: m });

            await m.react("💸");

        } catch (e) {
            console.error(e);
            m.reply("⨯ Ocurrio un error al procesar la transferencia.");
        }
    }
};

export default payCommand;
