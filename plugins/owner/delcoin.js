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

            let inputStr = args.join(' ').toLowerCase();
            let isAll = inputStr.includes('all');
            let amount = 0;

            if (!isAll) {
                let match = inputStr.match(/\d+/);
                if (match) amount = parseInt(match[0]);
            }

            if (!isAll && (!amount || isNaN(amount) || amount <= 0)) {
                let txt = `\n\t\t\t\t♛  *SISTEMA FINANCIERO* ♛\n\n`;
                txt += `✧ *USO CORRECTO:* ${usedPrefix + command} <cantidad | all> [@usuario / responder]\n`;
                return conn.reply(m.chat, txt, m);
            }

            let targetUser = await global.User.findOne({ id: who });
            if (!targetUser) targetUser = await global.User.create({ id: who, col: 0, exp: 0 });

            let currentCol = targetUser.col ?? 0;
            
            if (isAll) {
                amount = currentCol;
            } else if (amount > currentCol) {
                amount = currentCol; // No puede quitar más de lo que tiene el usuario
            }

            const newCol = currentCol - amount;
            
            await global.User.updateOne(
                { id: who }, 
                { $set: { col: newCol < 0 ? 0 : newCol } }
            );

            const txt = `
\t\t\t\t♛  *REDUCCIÓN DE FONDOS* ♛

◈  *DESTINATARIO:* @${who.split('@')[0]}
✦  *MONTO RETIRADO:* -${amount} Col
✧  *NUEVO BALANCE:* ${newCol < 0 ? 0 : newCol} Col
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
