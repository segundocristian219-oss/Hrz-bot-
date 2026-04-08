const addCommand = {
    name: 'add',
    alias: ['atd', 'añadir', 'agregar'],
    category: 'admin',
    isBotAdmin: true,
    run: async (m, { conn, text }) => {
        try {
            if (!m.isGroup) return m.reply('❌ Este comando solo se puede usar en grupos.');
            
            const groupMetadata = global.groupCache.get(m.chat) || await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants.map(p => p.id);
            const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            
            let input = text ? text : m.quoted ? m.quoted.sender : '';
            if (!input) return m.reply('❌ Proporciona un número o menciona a alguien.');

            let jid = input.replace(/\D/g, '') + '@s.whatsapp.net';

            if (participants.includes(jid)) return m.reply('❌ El usuario ya está en el grupo.');

            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add');

            for (let res of response) {
                if (res.status === '403') {
                    await m.reply('⚠️ El usuario tiene su cuenta privada. Enviando invitación directa...');
                    
                    const code = await conn.groupInviteCode(m.chat);
                    const inviteMsg = {
                        groupInviteMessage: {
                            groupJid: m.chat,
                            inviteCode: code,
                            inviteExpiration: 259200,
                            groupName: groupMetadata.subject,
                            caption: `Hola, te invito a unirte a mi grupo.`
                        }
                    };
                    
                    await conn.sendMessage(res.jid, inviteMsg);
                } else if (res.status === '408') {
                    await m.reply('❌ El usuario acaba de salir del grupo, no se puede agregar ahora.');
                } else if (res.status === '409') {
                    await m.reply('❌ El usuario ya es miembro del grupo.');
                } else if (res.status === '200') {
                    await m.react('✅');
                }
            }

        } catch (error) {
            console.error(error);
            m.reply('❌ Error al intentar agregar al usuario.');
        }
    }
};

export default addCommand;
