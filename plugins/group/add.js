const addCommand = {
    name: 'add',
    alias: ['atd', 'agregar'],
    category: 'admin',
    botadmin: true,
    grupo: true,
    run: async (m, { conn, text }) => {
        try {
            const groupMetadata = global.groupCache?.get(m.chat) || await conn.groupMetadata(m.chat).catch(() => null);
            if (!groupMetadata) return;

            let input = text?.trim() || (m.quoted ? m.quoted.sender : '');
            if (!input) return m.reply('❌ Escribe el número o menciona a alguien.');

            const num = input.replace(/\D/g, '');
            if (num.length < 7) return m.reply('❌ Número inválido.');

            const jid = `${num}@s.whatsapp.net`;
            const { subject: groupName, participants } = groupMetadata;

            const [result] = await conn.groupParticipantsUpdate(m.chat, [jid], 'add').catch(() => [null]);

            if (result?.status === '200') {
                await m.react('✅');
                return m.reply(`✨ @${num} ha sido añadido con éxito.`, null, { mentions: [jid] });
            }

            const statusMessages = {
                '403': '⛔ El usuario tiene restringido ser añadido a grupos.',
                '408': '⏳ El usuario no ha aceptado la invitación anterior.',
                '409': '⚠️ El usuario ya es miembro del grupo.',
                '500': '❌ Error interno al intentar añadir al usuario.'
            };

            const statusCode = result?.status?.toString();

            if (statusCode && statusCode !== '403' && statusCode !== '408') {
                return m.reply(statusMessages[statusCode] || `❌ No se pudo añadir. Código: ${statusCode}`);
            }

            const code = await conn.groupInviteCode(m.chat).catch(() => null);
            if (!code) return m.reply('❌ No se pudo añadir ni generar enlace de invitación.');

            const inviteText =
                `Hola, fuiste invitado a unirte al grupo *${groupName}*.\n\n` +
                `👥 *Miembros:* ${participants.length}\n` +
                `🔗 *Enlace:* https://chat.whatsapp.com/${code}`;

            const sent = await conn.sendMessage(jid, { text: inviteText }).catch(() => null);

            if (!sent) return m.reply('❌ No se pudo enviar la invitación al usuario.');

            await m.react('📨');
            return m.reply(`📨 Se envió invitación privada a @${num} porque no puede ser añadido directamente.`, null, { mentions: [jid] });

        } catch (err) {
            console.error('[add] Error:', err.message);
            return m.reply('❌ Ocurrió un error inesperado.');
        }
    }
};

export default addCommand;