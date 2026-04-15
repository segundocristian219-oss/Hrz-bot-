const banCommand = {
    name: 'banuser',
    alias: ['ban', 'banned', 'bloquear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner }) => {
        if (!isROwner) return;

        let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let reason = m.quoted ? text : text.split('|')[1] || 'Infracción de las reglas del sistema';

        if (!target || target.length < 10) return m.reply('⚠️ Indica a quién banear.');

        await global.User.findOneAndUpdate(
            { $or: [{ id: target }, { lid: target }] },
            { $set: { banned: true, banReason: reason.trim() } },
            { upsert: true }
        );

        await m.reply(`✅ Usuario bloqueado: @${target.split('@')[0]}\n📝 Razón: ${reason.trim()}`, null, { mentions: [target] });
    }
};

const unbanCommand = {
    name: 'unbanuser',
    alias: ['unban', 'desbanear', 'desbloquear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner }) => {
        if (!isROwner) return;

        let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        if (!target || target.length < 10) return m.reply('⚠️ Indica a quién desbloquear.');

        await global.User.findOneAndUpdate(
            { $or: [{ id: target }, { lid: target }] },
            { $set: { banned: false, banReason: '' } },
            { upsert: true }
        );

        await m.reply(`✅ Usuario desbloqueado: @${target.split('@')[0]}`, null, { mentions: [target] });
    }
};

export { banCommand, unbanCommand };
