const addCommand = {
    name: 'add',
    alias: ['atd', 'agregar'],
    category: 'admin',
    run: async (m, { conn, text }) => {
        try {
            if (!m.isGroup) return m.reply('❌ Este comando solo se puede usar en grupos.');
            
            const groupMetadata = global.groupCache.get(m.chat) || await conn.groupMetadata(m.chat);
            const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            

            let input = text ? text : m.quoted ? m.quoted.sender : '';
            if (!input) return m.reply('❌ Escribe el número.');

            let num = input.replace(/\D/g, '');
            let jid = num + '@s.whatsapp.net';

            const response = await conn.groupParticipantsUpdate(m.chat, [jid], 'add');
            
            for (let res of response) {
                if (res.status !== '200') {
                    let code = await conn.groupInviteCode(m.chat);
                    let inviteUrl = `https://chat.whatsapp.com/${code}`;
                    
                    await conn.sendMessage(jid, { 
                        text: `Hola, intenté agregarte al grupo *${groupMetadata.subject}* pero no fue posible. Únete aquí: ${inviteUrl}` 
                    });
                    
                    await m.reply(`⚠️ No se pudo agregar directo (Error ${res.status}). He enviado el enlace de invitación al privado de +${num}.`);
                } else {
                    await m.react('✅');
                }
            }

        } catch (error) {
            let num = text.replace(/\D/g, '');
            if (num) {
                try {
                    let code = await conn.groupInviteCode(m.chat);
                    await conn.sendMessage(num + '@s.whatsapp.net', { 
                        text: `Únete al grupo desde este enlace: https://chat.whatsapp.com/${code}` 
                    });
                    m.reply(`⚠️ Error crítico al agregar, pero ya envié el enlace al privado de +${num}.`);
                } catch (e) {
                    m.reply('❌ Error total: No se pudo agregar ni enviar invitación.');
                }
            }
        }
    }
};

export default addCommand;
