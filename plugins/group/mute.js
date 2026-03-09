const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text }) => {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!who || who === '@s.whatsapp.net') return m.reply(`*👑 Menciona o responde a alguien*`);

        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (who === ownerBot || who === botId) {
            return m.reply('🔥 *No puedes realizar esta acción con el staff del bot*');
        }

        const isMuting = (command === 'mute' || command === 'mutar' || command === 'silenciar');
        
        
        let targetUser = await global.User.findOneAndUpdate(
            { id: who },
            { $set: { muto: isMuting } },
            { new: true, upsert: true }
        );

        const status = isMuting ? 'silenciado' : 'desmutado';
        await conn.sendMessage(m.chat, { 
            text: `✅ *Usuario ${status} correctamente en la base de datos.*`, 
            mentions: [who] 
        }, { quoted: m });
    }
}

export default muteCommand;
