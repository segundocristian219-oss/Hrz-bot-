const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const addcoinCommand = {
    name: 'addcoin',
    alias: ['darcol', 'addcol', 'agregarmonedas', 'darcoins'],
    category: 'owner',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            const isOwner = global.owner.map(v => v[0] + '@s.whatsapp.net').includes(m.sender);
            if (!isOwner) {
                if (global.dfail) global.dfail('owner', m, conn);
                return;
            }

            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;

            let amount = parseInt(args[0] || (args[1] ? args[1] : 0));

            if (m.quoted && args[0] && !isNaN(args[0])) {
                amount = parseInt(args[0]);
            } else if (m.mentionedJid && m.mentionedJid[0] && args[1] && !isNaN(args[1])) {
                amount = parseInt(args[1]);
            } else if (!m.quoted && !m.mentionedJid && args[0] && !isNaN(args[0])) {
                amount = parseInt(args[0]);
            }

            if (isNaN(amount) || amount === 0) {
                let txt = `『 ✦ SISTEMA FINANCIERO ✦ 』\n\n`;
                txt += `◈ Uso: ${usedPrefix + command} <cantidad> [@usuario / responder]\n`;
                txt += `◈ Ejemplo: ${usedPrefix + command} -100\n`;
                return conn.reply(m.chat, txt, m);
            }

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, exp: 0 });

            const newCol = (targetUser.col ?? 0) + amount;
            
            await global.User.updateOne(
                { id: who }, 
                { $set: { col: newCol } }
            );

            const status = amount > 0 ? `+${formatCol(amount)}` : `${formatCol(amount)}`;
            
            const txt = `『 ✦ MOVIMIENTO DE FONDOS ✦ 』\n\n` +
                        `◈ Destinatario: @${who.split('@')[0]}\n` +
                        `◈ Cantidad: ${status} Col\n` +
                        `◈ Nuevo Balance: ${formatCol(newCol)} Col\n` +
                        `──────────────────`;

            await conn.sendMessage(m.chat, { 
                text: txt,
                mentions: [who],
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    ...(typeof channelInfo !== 'undefined' ? channelInfo : {})
                }
            }, { quoted: m });

            await m.react("✅");

        } catch (e) {
            console.error(e);
        }
    }
};

export default addcoinCommand;
