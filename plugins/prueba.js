const addCommand = {
    name: 'add',
    alias: ['atd', 'añadir', 'agregar'],
    category: 'admin',
    run: async (m, { conn, text }) => {
        try {
            if (!m.isGroup) return m.reply('❌ Este comando solo se puede usar en grupos.');
            
            const groupMetadata = global.groupCache.get(m.chat) || await conn.groupMetadata(m.chat);
            const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            

            let input = text ? text : m.quoted ? m.quoted.sender : '';
            if (!input) return m.reply('❌ Proporciona un número.');

            let jid = input.replace(/\D/g, '') + '@s.whatsapp.net';

            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add').catch(e => {
                return [{ status: 'error', jid }];
            });

            for (let res of response) {
                if (res.status === '403') {
                    const code = await conn.groupInviteCode(m.chat);
                    await conn.sendMessage(res.jid, {
                        groupInviteMessage: {
                            groupJid: m.chat,
                            inviteCode: code,
                            inviteExpiration: 259200,
                            groupName: groupMetadata.subject,
                            caption: `Hola, no pude agregarte directamente. Aquí tienes la invitación.`
                        }
                    });
                    await m.reply('⚠️ Cuenta privada, invitación enviada.');
                } else if (res.status === '408') {
                    await m.reply('❌ Salió recientemente del grupo.');
                } else if (res.status === '409') {
                    await m.reply('❌ Ya está en el grupo.');
                } else if (res.status === '200') {
                    await m.react('✅');
                } else {
                    await m.reply('❌ No se pudo agregar (Número inválido o error de red).');
                }
            }

        } catch (error) {
            console.error(error);
        }
    }
};

export default addCommand;
