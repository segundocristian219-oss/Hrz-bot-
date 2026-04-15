const handler = {
    name: 'ban/unban',
    alias: ['banuser', 'ban', 'unbanuser', 'unban', 'desbanear'],
    category: 'owner',
    run: async (m, { conn, text, isROwner, command }) => {
        try {
            if (!isROwner) return;

            const isUnban = /unban|desbanear/i.test(command);
            
            let target = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : (text.split('|')[0] || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (!target || target.length < 15) {
                return m.reply(`> ⚠️ Indica a quién ${isUnban ? 'desbloquear' : 'bloquear'}.`);
            }

            if (!isUnban && target === conn.user.id) return;

            let reason = m.quoted ? text : (text.split('|')[1] || 'Infracción de las reglas del sistema').trim();

            if (!global.User) throw new Error("La variable global.User no está definida. Revisa tu conexión a la DB.");

            const result = await global.User.findOneAndUpdate(
                { $or: [{ id: target }, { lid: target }] },
                { $set: { banned: !isUnban, banReason: isUnban ? '' : reason } },
                { upsert: true, new: true }
            );

            if (!result) throw new Error("No se pudo actualizar el usuario en MongoDB.");

            const status = isUnban ? '✅ Usuario desbloqueado' : '🚫 Usuario bloqueado';
            await m.reply(`${status}: @${target.split('@')[0]}${!isUnban ? '\n📝 Razón: ' + reason : ''}`, null, { mentions: [target] });

        } catch (e) {
            let errorMsg = `*─── [ ❌ ERROR DE COMANDO ] ───*\n\n`;
            errorMsg += `*📍 Comando:* ${command}\n`;
            errorMsg += `*⚠️ Error:* ${e.message}\n\n`;
            errorMsg += `_El error ha sido capturado y enviado al chat para depuración._`;
            
            await conn.reply(m.chat, errorMsg, m);
        }
    }
};

export default handler;
