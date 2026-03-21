const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text, chat }) => {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!who || who === '@s.whatsapp.net') return m.reply(`*👑 Menciona o responde a alguien*`);

        const ownerBot = global.owner[0][0] + '@s.whatsapp.net';
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        if (who === ownerBot || who === botId) {
            return m.reply('🔥 *No puedes realizar esta acción con el staff del bot*');
        }

        const isMuting = ['mute', 'mutar', 'silenciar'].includes(command);
        
        if (!Array.isArray(chat.mutos)) chat.mutos = [];

        if (isMuting) {
            if (chat.mutos.includes(who)) return m.reply('*Este usuario ya está silenciado en este grupo.*');
            chat.mutos.push(who);
        } else {
            if (!chat.mutos.includes(who)) return m.reply('*Este usuario no está en la lista de silencios.*');
            chat.mutos = chat.mutos.filter(id => id !== who);
        }

        await chat.save();

        const status = isMuting ? 'silenciado' : 'desmutado';
        await conn.sendMessage(m.chat, { 
            text: `✅ *Usuario ${status} correctamente.*`, 
            mentions: [who] 
        }, { quoted: m });
    }
}

export default muteCommand;
