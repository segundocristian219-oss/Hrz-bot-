const handler = {
    name: 'ban/unban',
    alias: ['banuser', 'ban', 'unbanuser', 'unban', 'desbanear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner, command }) => {
        try {
            if (!isROwner) return;

            const isUnban = /unban|desbanear/i.test(command);
            let target;

            if (m.quoted) {
                target = m.quoted.sender;
            } else if (m.mentionedJid && m.mentionedJid.length > 0) {
                target = m.mentionedJid[0];
            } else if (text) {
                let num = text.split('|')[0].replace(/[^0-9]/g, '');
                if (num.length >= 8) target = num + '@s.whatsapp.net';
            }

            if (!target) {
                return m.reply(`> ⚠️ *Falta objetivo*\nUso: ${command} [@mención / responder / número]`);
            }

            if (!isUnban && (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === conn.user.id)) {
                return m.reply("> ❌ No puedes banear al propio bot.");
            }

            let reason = m.quoted ? text : (text.split('|')[1] || 'Infracción de las reglas del sistema').trim();

            if (!global.User) throw new Error("DB_NOT_FOUND: global.User no existe.");

            const update = { 
                $set: { 
                    banned: !isUnban, 
                    banReason: isUnban ? '' : reason 
                } 
            };

            const result = await global.User.findOneAndUpdate(
                { id: target }, 
                update, 
                { upsert: true, new: true }
            );

            const status = isUnban ? '✅ USUARIO DESBLOQUEADO' : '🚫 USUARIO BLOQUEADO';
            await conn.reply(m.chat, `${status}\n\n*👤 ID:* @${target.split('@')[0]}${!isUnban ? '\n*📝 Razón:* ' + reason : ''}`, m, { mentions: [target] });

        } catch (e) {
            await conn.reply(m.chat, `*─── [ ❌ ERROR CRÍTICO ] ───*\n\n*Detalle:* ${e.message}`, m);
        }
    }
};

export default handler;
