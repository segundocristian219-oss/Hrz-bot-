const handler = {
    name: 'ban/unban',
    alias: ['banuser', 'ban', 'unbanuser', 'unban', 'desbanear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner, command }) => {
        try {
            if (!isROwner) return;

            const isUnban = /unban|desbanear/i.test(command);
            let target;
            let reason = 'Infracción de las reglas del sistema';

            if (m.quoted) {
                target = m.quoted.sender;
                reason = text || reason;
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
                reason = text.replace(/@(\d+)/g, '').trim() || reason;
            } else if (text) {
                let input = text.split(' ');
                let num = input[0].replace(/[^0-9]/g, '');
                if (num.length >= 8) {
                    target = num + '@s.whatsapp.net';
                    reason = input.slice(1).join(' ').trim() || reason;
                }
            }

            if (!target) {
                return m.reply(`> ✰ *Falta objetivo*\nUso: ${command} [@mención / responder / número] [razón]`);
            }

            if (!isUnban && (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === conn.user.id)) {
                return;
            }

            if (!global.User) throw new Error("DB_NOT_FOUND");

            await global.User.findOneAndUpdate(
                { id: target },
                { $set: { banned: !isUnban, banReason: isUnban ? '' : reason } },
                { upsert: true }
            );

            const status = isUnban ? '♛ USUARIO DESBLOQUEADO' : '✘ USUARIO BLOQUEADO';
            await conn.reply(m.chat, `${status}\n\n*✰ ID:* @${target.split('@')[0]}${!isUnban ? '\n*➠ Razón:* ' + reason : ''}`, m, { mentions: [target] });

        } catch (e) {
            await conn.reply(m.chat, `*─── [ ❌ ERROR ] ───*\n\n${e.message}`, m);
        }
    }
};

export default handler;
