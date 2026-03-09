const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text }) => {
        // Limpiamos el ID para que siempre sea consistente
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!who || who === '@s.whatsapp.net') return m.reply(`*👑 Menciona o responde a alguien*`);

        // Validación de seguridad para dueños
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';
        if (who === ownerBot || who === conn.user.id.split(':')[0] + '@s.whatsapp.net') {
            return m.reply('🔥 *No puedes realizar esta acción con el staff del bot*');
        }

        // BUSQUEDA O CREACIÓN: Si no existe en la DB, lo creamos para poder mutarlo
        let targetUser = await global.User.findOne({ id: who });
        if (!targetUser) {
            targetUser = await global.User.create({ 
                id: who, 
                name: "Usuario Nuevo", 
                muto: false, 
                exp: 0 
            });
        }

        if (command === 'mute' || command === 'mutar' || command === 'silenciar') {
            if (targetUser.muto) return m.reply('🔥 *Este usuario ya está en la lista de silenciados*');
            
            targetUser.muto = true;
            await targetUser.save(); // Forzamos la escritura en la DB
            await conn.sendMessage(m.chat, { text: `✅ *Usuario silenciado correctamente.*`, mentions: [who] }, { quoted: m });

        } else if (command === 'unmute') {
            if (!targetUser.muto) return m.reply('🔥 *Este usuario NO está silenciado en mi base de datos*');

            targetUser.muto = false;
            await targetUser.save(); // Forzamos la actualización
            await conn.sendMessage(m.chat, { text: `✅ *Usuario desmutado correctamente.*`, mentions: [who] }, { quoted: m });
        }
    }
}

export default muteCommand;
