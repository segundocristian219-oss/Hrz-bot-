const h = {
    name: 'reactcanal',
    alias: ['rc'],
    category: 'main',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`*Formato incorrecto*\nUso: ${usedPrefix + command} [link-mensaje] [emoji]`);

        const [link, emoji] = text.split(' ');
        if (!link || !emoji) return m.reply('❌ Falta el enlace o el emoji.');

        try {
            const parts = link.trim().split('/');
            const serverId = parts[parts.length - 1];
            const inviteCode = parts[parts.length - 2];

            const metadata = await conn.newsletterMetadata("invite", inviteCode);
            const jid = metadata.id;

            await conn.query({
                tag: 'message',
                attrs: { to: jid, type: 'reaction', server_id: serverId },
                content: [{
                    tag: 'reaction',
                    attrs: { code: emoji }
                }]
            });

            m.reply(`✅ Reacción enviada con éxito.`);

        } catch (e) {
            m.reply(`❌ Error:\n${e.message}`);
        }
    }
};

export default h;
