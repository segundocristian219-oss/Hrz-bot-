const delcoinCommand = {
    name: 'delcoin',
    alias: ['quitarcol', 'delcol', 'quitarmonedas', 'restarcoins'],
    category: 'owner',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            const isOwner = global.owner.map(v => v[0] + '@s.whatsapp.net').includes(m.sender);
            if (!isOwner) {
                global.dfail('owner', m, conn);
                return;
            }

            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, exp: 0 });

            let input = args.join(' ').toLowerCase();
            let isAll = input.includes('all');
            let amount = 0;

            if (isAll) {
                amount = targetUser.col ?? 0;
            } else {
                amount = parseInt(args[0] || (args[1] ? args[1] : 0));
                if (m.quoted && args[0] && !isNaN(args[0])) {
                    amount = parseInt(args[0]);
                } else if (m.mentionedJid && m.mentionedJid[0] && args[1] && !isNaN(args[1])) {
                    amount = parseInt(args[1]);
                } else if (!m.quoted && !m.mentionedJid && args[0] && !isNaN(args[0])) {
                    amount = parseInt(args[0]);
                }
            }

            if (!isAll && (!amount || isNaN(amount) || amount <= 0)) {
                let txt = `\n\t\t\t\t♛  *SISTEMA FINANCIERO* ♛\n\n`;
                txt += `✧ *USO CORRECTO:* ${usedPrefix + command} <cantidad | all> [@usuario / responder]\n`;
                return conn.reply(m.chat, txt, m);
            }

            const newCol = (targetUser.col ?? 0) - amount;
            const finalCol = newCol < 0 ? 0 : newCol;
            const removedAmount = isAll ? (targetUser.col ?? 0) : (amount > (targetUser.col ?? 0) ? (targetUser.col ?? 0) : amount);
            
            await global.User.updateOne(
                { id: who }, 
                { $set: { col: finalCol } }
            );

            const txt = `
\t\t\t\t♛  *REDUCCIÓN DE FONDOS* ♛

◈  *DESTINATARIO:* @${who.split('@')[0]}
✦  *MONTO RETIRADO:* -${removedAmount} Col
✧  *NUEVO BALANCE:* ${finalCol} Col
`;

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

export default delcoinCommand;
