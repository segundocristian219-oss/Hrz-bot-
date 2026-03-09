const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text, chat }) => {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!who || who === '@s.whatsapp.net') return m.reply(`*👑 Menciona o responde al mensaje de la persona que deseas ${command === 'unmute' ? 'desmutar' : 'mutar'}*`);

        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';
        if (who === ownerBot) return m.reply('🔥 *No puedes mutar al creador del bot*');
        if (who === conn.user.id.split(':')[0] + '@s.whatsapp.net') return m.reply('🔥 *No puedes mutar al propio bot*');

        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupOwner = groupMetadata.owner || m.chat.split('-')[0] + '@s.whatsapp.net';
        if (who === groupOwner) return m.reply('🔥 *No puedes mutar al creador del grupo*');

        
        let targetUser = await global.User.findOne({ id: who });
        if (!targetUser) return m.reply('❌ El usuario no está registrado en mi base de datos.');

        if (command === 'mute' || command === 'mutar' || command === 'silenciar') {
            if (targetUser.muto) return m.reply('🔥 *Este usuario ya está silenciado globalmente*');

            targetUser.muto = true; 
            await targetUser.save();
            
            await conn.sendMessage(m.chat, { text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼\n*Sus mensajes serán eliminados automáticamente.*`, mentions: [who] }, { quoted: m });

        } else if (command === 'unmute') {
            if (!targetUser.muto) return m.reply('🔥 *Este usuario no está silenciado*');

            targetUser.muto = false; // Desactivamos el mute
            await targetUser.save();
            
            await conn.sendMessage(m.chat, { text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼\n*Ya puede enviar mensajes normalmente.*`, mentions: [who] }, { quoted: m });
        }
    }
}

export default muteCommand;
