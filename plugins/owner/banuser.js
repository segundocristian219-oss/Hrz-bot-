const handler = {
    name: 'ban/unban',
    alias: ['banuser', 'ban', 'unbanuser', 'unban', 'desbanear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner, command }) => {
        if (!isROwner) return;

        const isUnban = /unban|desbanear/i.test(command);
        let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : (text.split('|')[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        if (!target || target.length < 15) return m.reply(`> ⚠️ Indica a quién ${isUnban ? 'desbloquear' : 'bloquear'}.`);

        if (!isUnban && target === conn.user.jid) return;

        let reason = m.quoted ? text : (text.split('|')[1] || 'Infracción de las reglas del sistema').trim();

        await global.User.findOneAndUpdate(
            { $or: [{ id: target }, { lid: target }] },
            { $set: { banned: !isUnban, banReason: isUnban ? '' : reason } },
            { upsert: true }
        );

        const status = isUnban ? '✅ Usuario desbloqueado' : '🚫 Usuario bloqueado';
        m.reply(`${status}: @${target.split('@')[0]}${!isUnban ? '\n📝 Razón: ' + reason : ''}`, null, { mentions: [target] });
    }
};

export default handler;
