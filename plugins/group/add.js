const addCommand = {
    name: 'add',
    alias: ['atd', 'agregar'],
    category: 'admin',
    botAdmin: true,
    grupo: true,
    run: async (m, { conn, text, participants }) => {
        try {
            const groupMetadata = global.groupCache?.get(m.chat) || await conn.groupMetadata(m.chat).catch(() => null);
            if (!groupMetadata) return;

            let input = text?.trim() || (m.quoted?.sender ? m.quoted.sender : '');
            if (!input) return m.reply('❌ Escribe el número o menciona a alguien.');

            const num = input.replace(/@.*$/, '').replace(/\D/g, '');
            if (num.length < 7) return m.reply('❌ Número inválido.');

            const jid = `${num}@s.whatsapp.net`;
            const { subject: groupName, participants: members } = groupMetadata;

            const alreadyIn = members.some(p => p.id?.includes(num));
            if (alreadyIn) return m.reply('⚠️ El usuario ya es miembro del grupo.');

            const result = await conn.groupParticipantsUpdate(m.chat, [jid], 'add').catch(() => null);
            const res = Array.isArray(result) ? result[0] : null;
            const statusCode = res?.status?.toString();

            if (statusCode === '200') {
                await m.react('✅');
                return m.reply(`✨ @${num} ha sido añadido con éxito.`, m.chat, { mentions: [jid] });
            }

            if (statusCode === '409') return m.reply('⚠️ El usuario ya es miembro del grupo.');
            if (statusCode === '500') return m.reply('❌ Error interno al intentar añadir al usuario.');

            const code = await conn.groupInviteCode(m.chat).catch(() => null);
            if (!code) return m.reply('❌ No se pudo añadir ni generar enlace de invitación.');

            const inviteText =
                `Hola, fuiste invitado a unirte al grupo *${groupName}*.\n\n` +
                `👥 *Miembros:* ${members.length}\n` +
                `🔗 *Enlace:* https://chat.whatsapp.com/${code}`;

            await conn.sendMessage(jid, { text: inviteText }).catch(() => null);

            await m.react('📨');
            return m.reply(
                `📨 Se envió invitación privada a @${num} porque no puede ser añadido directamente.`,
                m.chat,
                { mentions: [jid] }
            );

        } catch (err) {
            console.error('[add] Error:', err.message);
            return m.reply('❌ Ocurrió un error inesperado.');
        }
    }
};

export default addCommand;