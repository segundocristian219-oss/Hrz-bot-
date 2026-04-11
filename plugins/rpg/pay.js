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
            let amount = parseInt(args.find(a => !isNaN(a) && !a.includes('@')));

            if (!who || isNaN(amount) || amount <= 0) {
                let txt = `『 ✦ SISTEMA BANCARIO ✦ 』\n\n`;
                txt += `◈ Uso: ${usedPrefix + command} <cantidad> [@usuario / responder]\n`;
                txt += `◈ Ejemplo: ${usedPrefix + command} 1500 @usuario\n`;
                return conn.reply(m.chat, txt, m);
            }

            const f_sender = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net';
            const f_target = who.split('@')[0].split(':')[0] + '@s.whatsapp.net';

            if (f_target === f_sender) return m.reply("⨯ No puedes transferir fondos a ti mismo.");

            let senderUser = await global.User.findOne({ id: f_sender });
            if (!senderUser) senderUser = await global.User.create({ id: f_sender, col: 0, banco: 0 });

            const currentBanco = senderUser.banco || 0;

            if (currentBanco < amount) {
                return m.reply(`⨯ Fondos insuficientes.\n◈ Tu saldo bancario es de: ${formatCol(currentBanco)} Col.`);
            }

            let targetUser = await global.User.findOne({ id: f_target });
            if (!targetUser) targetUser = await global.User.create({ id: f_target, col: 0, banco: 0 });

            await global.User.updateOne({ id: f_sender }, { $inc: { banco: -amount } });
            await global.User.updateOne({ id: f_target }, { $inc: { banco: amount } });

            const txt = `『 ✦ TRANSFERENCIA EXITOSA ✦ 』\n\n` +
                        `◈ Remitente: @${f_sender.split('@')[0]}\n` +
                        `◈ Destinatario: @${f_target.split('@')[0]}\n` +
                        `◈ Monto: ${formatCol(amount)} Col\n` +
                        `──────────────────\n` +
                        `✦ Nuevo saldo: ${formatCol(currentBanco - amount)} Col\n` +
                        `──────────────────`;

            await conn.sendMessage(m.chat, { text: txt, mentions: [f_sender, f_target] }, { quoted: m });
            await m.react("💸");

        } catch (e) {
            console.error(who, amount, e);
            m.reply("⨯ Error al procesar la transferencia.");
        }
    }
};

export default payCommand;
