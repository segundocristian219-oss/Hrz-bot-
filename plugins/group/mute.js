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

        if (!chat.mutos) chat.mutos = [];

        if (command === 'mute' || command === 'mutar' || command === 'silenciar') {
            if (chat.mutos.includes(who)) return m.reply('🔥 *Este usuario ya ha sido mutado en este grupo*');

            chat.mutos.push(who);
            await chat.save();
            await conn.sendMessage(m.chat, { text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼\n*Sus mensajes serán eliminados automáticamente en este grupo.*`, mentions: [who] }, { quoted: m });

        } else if (command === 'unmute') {
            if (!chat.mutos.includes(who)) return m.reply('🔥 *Este usuario no está mutado en este grupo*');

            chat.mutos = chat.mutos.filter(id => id !== who);
            await chat.save();
            await conn.sendMessage(m.chat, { text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼\n*Ya puede enviar mensajes normalmente.*`, mentions: [who] }, { quoted: m });
        }
    }
}

export default muteCommand;
