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
            
            let amount = args[0];
            if (m.mentionedJid && m.mentionedJid[0]) amount = args[1];
            amount = parseInt(amount);

            if (!who || isNaN(amount) || amount <= 0) {
                let txt = `『 ✦ SISTEMA BANCARIO ✦ 』\n\n`;
                txt += `◈ Uso: ${usedPrefix + command} <cantidad> [@usuario / responder]\n`;
                txt += `◈ Ejemplo: ${usedPrefix + command} 1500 @usuario\n`;
                return conn.reply(m.chat, txt, m);
            }

            if (who === m.sender) return m.reply("⨯ No puedes transferir fondos a ti mismo.");

            let senderUser = await global.User.findOne({ id: m.sender });
            if (!senderUser) senderUser = await global.User.create({ id: m.sender, col: 0, banco: 0 });

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, banco: 0 });

            const senderBanco = senderUser.banco || 0;

            if (senderBanco < amount) {
                return m.reply(`⨯ Fondos insuficientes.\n◈ Tu saldo bancario es de: ${formatCol(senderBanco)} Col.`);
            }

            await global.User.updateOne({ id: m.sender }, { $inc: { banco: -amount } });
            await global.User.updateOne({ id: who }, { $inc: { banco: amount } });

            const txt = `『 ✦ TRANSFERENCIA EXITOSA ✦ 』\n\n` +
                        `◈ Remitente: @${m.sender.split('@')[0]}\n` +
                        `◈ Destinatario: @${who.split('@')[0]}\n` +
                        `◈ Monto Transferido: ${formatCol(amount)} Col\n` +
                        `──────────────────\n` +
                        `✦ Nuevo saldo: ${formatCol(senderBanco - amount)} Col\n` +
                        `──────────────────`;

            await conn.sendMessage(m.chat, { 
                text: txt,
                mentions: [m.sender, who],
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    ...(typeof channelInfo !== 'undefined' ? channelInfo : {})
                }
            }, { quoted: m });

            await m.react("💸");

        } catch (e) {
            console.error(e);
            m.reply("⨯ Error al procesar la transferencia.");
        }
    }
};

export default payCommand;
