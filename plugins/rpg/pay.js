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
            let amount = parseInt(args[0] || (args[1] ? args[1] : 0));

            if (m.quoted && args[0] && !isNaN(args[0])) {
                amount = parseInt(args[0]);
            } else if (m.mentionedJid && m.mentionedJid[0] && args[1] && !isNaN(args[1])) {
                amount = parseInt(args[1]);
            } else if (!m.quoted && !m.mentionedJid && args[0] && !isNaN(args[0])) {
                amount = parseInt(args[0]);
            }

            if (!who) {
                let txt = `『 ✦ SISTEMA BANCARIO ✦ 』\n\n`;
                txt += `◈ Uso: ${usedPrefix + command} <cantidad> [@usuario / responder]\n`;
                txt += `◈ Ejemplo: ${usedPrefix + command} 1500 @usuario\n`;
                return conn.reply(m.chat, txt, m);
            }

            if (who === m.sender) {
                return m.reply("⨯ Operacion rechazada: No puedes transferir fondos a ti mismo.");
            }

            if (isNaN(amount) || amount <= 0) {
                return m.reply("⨯ Operacion rechazada: Ingresa una cantidad valida mayor a 0.");
            }

            let senderUser = await global.User.findOne({ id: m.sender });
            if (!senderUser) senderUser = await global.User.create({ id: m.sender, col: 0, banco: 0 });

            const senderBanco = senderUser.banco || 0;

            if (senderBanco < amount) {
                return m.reply(`⨯ Fondos insuficientes.\n◈ Tu saldo bancario es de: ${formatCol(senderBanco)} Col.`);
            }

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, banco: 0 });

            const newSenderBanco = senderBanco - amount;
            const newTargetBanco = (targetUser.banco || 0) + amount;

            await global.User.updateOne({ id: m.sender }, { $set: { banco: newSenderBanco } });
            await global.User.updateOne({ id: who }, { $set: { banco: newTargetBanco } });

            const txt = `『 ✦ TRANSFERENCIA EXITOSA ✦ 』\n\n` +
                        `◈ Remitente: @${m.sender.split('@')[0]}\n` +
                        `◈ Destinatario: @${who.split('@')[0]}\n` +
                        `◈ Monto Transferido: ${formatCol(amount)} Col\n` +
                        `──────────────────\n` +
                        `✦ Tu nuevo balance bancario: ${formatCol(newSenderBanco)} Col\n` +
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
            m.reply("⨯ Ocurrio un error al procesar la transferencia.");
        }
    }
};

export default payCommand;
