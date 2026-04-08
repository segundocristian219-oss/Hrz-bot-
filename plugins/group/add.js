const addCommand = {
    name: 'add',
    alias: ['atd', 'agregar'],
    category: 'admin',
    botadmin: true,
    grupo: true,
    run: async (m, { conn, text }) => {
        let num;
        try {
            const groupMetadata = global.groupCache.get(m.chat) || await conn.groupMetadata(m.chat).catch(() => null);
            if (!groupMetadata) return;

            let input = text ? text : m.quoted ? m.quoted.sender : '';
            if (!input) return m.reply('❌ Escribe el número o menciona a alguien.');

            num = input.replace(/\D/g, '');
            if (num.length < 7) return m.reply('❌ Número inválido.');
            
            let jid = num + '@s.whatsapp.net';
            let groupName = groupMetadata.subject;
            let totalMem = groupMetadata.participants.length;

            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add').catch(() => {
                return [{ status: '403', jid }];
            });
            
            const res = response[0];

            if (res.status === '200') {
                await m.react('✅');
                return await m.reply(`✨ @${num} ha sido añadido con éxito.`, null, { mentions: [jid] });
            }

            const code = await conn.groupInviteCode(m.chat).catch(() => null);
            if (!code) return m.reply('❌ No pude generar un enlace de invitación.');

            const inviteUrl = `https://chat.whatsapp.com/${code}`;
            const inviteBody = `Hola @${num}, fuiste invitado a unirte a nuestro grupo.\n\n*Grupo:* ${groupName}\n*Miembros:* ${totalMem}\n*Enlace:* ${inviteUrl}`;

            await conn.sendMessage(jid, { text: inviteBody, mentions: [jid] }).catch(() => null);
            await m.reply(`✅ Se ha enviado una invitación privada a @${num} debido a sus ajustes de privacidad.`, null, { mentions: [jid] });

        } catch (error) {
            console.log('Error controlado en Add:', error.message);
        }
    }
};

export default addCommand;
