export const addCommand = {
    category: 'group',
    commands: {
        add: {
            name: 'add',
            alias: ['atd', 'agregar'],
            botAdmin: true,
            grupo: true,
            run: async (m, { conn, text }) => {
                try {
                    const groupMetadata = global.groupCache?.get(m.chat) || await conn.groupMetadata(m.chat).catch(() => null);
                    if (!groupMetadata) return m.reply('❌');

                    let input = text?.trim() || (m.quoted?.sender ? m.quoted.sender : '');
                    if (!input) return m.reply('❌');

                    const num = input.replace(/@.*$/, '').replace(/\D/g, '');
                    if (num.length < 7) return m.reply('❌');

                    const jid = `${num}@s.whatsapp.net`;
                    const { subject: groupName } = groupMetadata;

                    const code = await conn.groupInviteCode(m.chat).catch(() => null);
                    if (!code) return m.reply('❌');

                    const inviteText = `Hola, @${m.sender.split('@')[0]} te ha invitado a unirte al grupo *${groupName}*.\n\n🔗 *Enlace:* https://chat.whatsapp.com/${code}`;

                    await conn.sendMessage(jid, { 
                        text: inviteText, 
                        mentions: [m.sender] 
                    }).catch(() => null);

                    await m.react('📨');
                    
                    return conn.sendMessage(m.chat, {
                        text: `🌟 Invitación enviada a @${num}.`,
                        mentions: [jid]
                    }, { quoted: m });

                } catch (err) {
                    console.error(err);
                    return m.reply('❌');
                }
            }
        }
    }
};
