const addCommand = {
    name: 'add',
    alias: ['atd', 'agregar'],
    category: 'grupo',
    botadmin: true,
    grupo: true,
    run: async (m, { conn, text }) => {
        try {
            const groupMetadata = global.groupCache.get(m.chat) || await conn.groupMetadata(m.chat);
            let input = text ? text : m.quoted ? m.quoted.sender : '';
            if (!input) return m.reply('♛ Escribe el número o menciona a alguien.');

            let num = input.replace(/\D/g, '');
            let jid = num + '@s.whatsapp.net';
            let groupName = groupMetadata.subject;
            let totalMem = groupMetadata.participants.length;

            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add');
            
            for (let res of response) {
                if (res.status !== '200') {
                    const code = await conn.groupInviteCode(m.chat);
                    const inviteUrl = `https://chat.whatsapp.com/${code}`;
                    
                    const inviteBody = `Hola @${num}, fuiste invitado a unirte a nuestro grupo.\n\n` +
                                     `*Grupo:* ${groupName}\n` +
                                     `*Miembros:* ${totalMem}\n` +
                                     `*Enlace:* ${inviteUrl}`;

                    await conn.sendMessage(jid, { 
                        text: inviteBody,
                        mentions: [jid]
                    });
                    
                    await m.reply(`*✰ Se ha enviado una invitación privada a @${num} para que se una a ${groupName}*.`, null, { mentions: [jid] });
                } else {
                    await m.react('✅');
                    await m.reply(`*♛ @${num} ha sido añadido con éxito.*`, null, { mentions: [jid] });
                }
            }

        } catch (error) {
            let num = text.replace(/\D/g, '');
            if (num) {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const code = await conn.groupInviteCode(m.chat);
                    const jid = num + '@s.whatsapp.net';
                    
                    const inviteBody = `Hola @${num}, te enviamos una invitación para unirte.\n\n` +
                                     `*Grupo:* ${groupMetadata.subject}\n` +
                                     `*Miembros:* ${groupMetadata.participants.length}\n` +
                                     `*Link:* https://chat.whatsapp.com/${code}`;

                    await conn.sendMessage(jid, { text: inviteBody, mentions: [jid] });
                    await m.reply(`*⍰ Se envió la invitación al privado de @${num} debido a restricciones del usuario.*`, null, { mentions: [jid] });
                } catch (e) {
                    await m.reply('❌ No fue posible añadir ni enviar invitación.');
                }
            }
        }
    }
};

export default addCommand;
