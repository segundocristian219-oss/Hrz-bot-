import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000,
    MIN_STEAL: 100,
    MAX_STEAL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const stealCommand = {
    name: 'steal',
    alias: ['robar', 'hurtar'],
    category: 'economy',
    run: async (m, { conn, isOwner }) => {
        let targetId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null);

        if (!targetId) return m.reply("⨯ Etiqueta a alguien o responde a su mensaje para robarle.");
        if (targetId === m.sender) return m.reply("⨯ No puedes robarte a ti mismo.");

        let user = await global.User.findOne({ id: m.sender });
        let target = await global.User.findOne({ id: targetId });

        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });
        if (!target) return m.reply("⨯ La victima no tiene una cuenta registrada.");
        
        if ((target.col || 0) <= ECO_CONFIG.BASE_COL) return m.reply("⨯ La victima no tiene suficiente dinero para ser robada.");

        const now = Date.now();
        const cooldown = 30 * 60 * 1000;

        if (!isOwner && user.lastSteal && (now - user.lastSteal) < cooldown) {
            const remaining = cooldown - (now - user.lastSteal);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            return m.reply(`⨯ Debes esperar ${minutes}m ${seconds}s para volver a robar.`);
        }

        const chance = Math.random();
        let stealTxt = "";

        if (chance < 0.40) { 
            stealTxt = `『 INTENTO FALLIDO 』\n\n✦ @${m.sender.split('@')[0]} intentó robarle a @${targetId.split('@')[0]} pero lo descubrieron y huyó con las manos vacías.\n\n──────────────────`;
        } else {
            let amount = Math.floor(Math.random() * (ECO_CONFIG.MAX_STEAL - ECO_CONFIG.MIN_STEAL + 1)) + ECO_CONFIG.MIN_STEAL;

            let targetBalance = target.col || ECO_CONFIG.BASE_COL;
            let limitToSteal = targetBalance - ECO_CONFIG.BASE_COL;

            if (amount > limitToSteal) amount = limitToSteal;

            const newUserCol = (user.col || ECO_CONFIG.BASE_COL) + amount;
            const newTargetCol = targetBalance - amount;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newUserCol, lastSteal: now } });
            await global.User.updateOne({ id: targetId }, { $set: { col: newTargetCol } });

            stealTxt = `『 ROBO EXITOSO 』\n\n✦ Ladrón: @${m.sender.split('@')[0]}\n✦ Víctima: @${targetId.split('@')[0]}\n──────────────────\n◈ Botín: +${formatCol(amount)} Col\n✧ Balance: ${formatCol(newUserCol)} Col\n──────────────────\n> Solo se puede robar por encima del monto base.`;
        }

        await conn.sendMessage(m.chat, { text: stealTxt, mentions: [m.sender, targetId] }, { quoted: m });
    }
};

export default stealCommand;
