const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text }) => {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!who || who === '@s.whatsapp.net') return m.reply(`*♛ Menciona o responde a alguien*`);

        const ownersJids = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net');
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        if (ownersJids.includes(who)) return m.reply('> ╰❒ No puedo mutear a mi creador.');
        if (who === botId) return m.reply('> ╰❒ No puedo mutearme a mí mismo.');

        const isMuting = ['mute', 'mutar', 'silenciar'].includes(command);

        if (isMuting) {
            await global.Chat.findOneAndUpdate(
                { id: m.chat },
                { $addToSet: { mutos: who } } 
            );
        } else {
            await global.Chat.findOneAndUpdate(
                { id: m.chat },
                { $pull: { mutos: who } } 
            );
        }

        const status = isMuting ? 'silenciado' : 'desmutado';
        await conn.sendMessage(m.chat, { 
            text: `> ♛ *Usuario ${status} correctamente.*`, 
            mentions: [who] 
        }, { quoted: m });
    }
}

export default muteCommand;
