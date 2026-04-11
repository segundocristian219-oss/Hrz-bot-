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

            const senderId = m.sender.split('@')[0];
            const targetId = who.split('@')[0];

            if (targetId === senderId) return m.reply("⨯ Operacion rechazada: No puedes transferir fondos a ti mismo.");

            let senderUser = await global.User.findOne({ id: { $regex: senderId } });
            if (!senderUser) senderUser = await global.User.create({ id: m.sender, col: 0, banco: 0 });

            const currentBanco = senderUser.banco || 0;

            if (currentBanco < amount) {
                return m.reply(`⨯ Fondos insuficientes.\n◈ Tu saldo bancario es de: ${formatCol(currentBanco)} Col.`);
            }

            let targetUser = await global.User.findOne({ id: { $regex: targetId } });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, banco: 0 });

            await global.User.updateOne({ _id: senderUser._id }, { $inc: { banco: -amount } });
            await global.User.updateOne({ _id: targetUser._id }, { $inc: { banco: amount } });

            const txt = `『 ✦ TRANSFERENCIA EXITOSA ✦ 』\n\n` +
                        `◈ Remitente: @${senderId}\n` +
                        `◈ Destinatario: @${targetId}\n` +
                        `◈ Monto Transferido: ${formatCol(amount)} Col\n` +
                        `──────────────────\n` +
                        `✦ Tu nuevo balance: ${formatCol(currentBanco - amount)} Col\n` +
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
            m.reply("⨯ Ocurrio un error al procesar la transferencia en la base de datos.");
        }
    }
};

export default payCommand;
                                                                   
