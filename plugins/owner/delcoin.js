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

            if (!global.users[who]) {
                global.users[who] = { monedas: 0, xp: 0 };
            }

            let inputStr = args.join(' ').toLowerCase();
            let isAll = inputStr.includes('all');
            let amount = 0;

            if (isAll) {
                amount = global.users[who].monedas || 0;
            } else {
                let match = inputStr.match(/\d+/);
                if (match) amount = parseInt(match[0]);
            }

            if (!isAll && (!amount || isNaN(amount) || amount <= 0)) {
                let txt = `\n\t\t\t\t♛  *SISTEMA FINANCIERO* ♛\n\n`;
                txt += `✧ *USO CORRECTO:* ${usedPrefix + command} <cantidad | all> [@usuario / responder]\n`;
                return conn.reply(m.chat, txt, m);
            }

            if (amount > (global.users[who].monedas || 0)) {
                amount = global.users[who].monedas || 0;
            }

            global.users[who].monedas -= amount;
            if (global.users[who].monedas < 0) global.users[who].monedas = 0;

            const txt = `
\t\t\t\t♛  *REDUCCIÓN DE FONDOS* ♛

◈  *DESTINATARIO:* @${who.split('@')[0]}
✦  *MONTO RETIRADO:* -${amount} Col
✧  *NUEVO BALANCE:* ${global.users[who].monedas} Col
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
                                  
