const h = {
    name: 'reactcanal',
    alias: ['rc'],
    category: 'main',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`*Formato incorrecto*\nUso: ${usedPrefix + command} [link-mensaje] [emoji]\n\nEjemplo:\n${usedPrefix + command} https://whatsapp.com/channel/0029Vb8JHz6Fcow9KCuBVp1K/178 ✅`);

        const [link, emoji] = text.split(' ');
        if (!link || !emoji) return m.reply('❌ Falta el enlace o el emoji.');

        try {
            const parts = link.split('/');
            const serverId = parts[parts.length - 1];
            const inviteCode = parts[parts.length - 2];

            const metadata = await conn.newsletterMetadata("invite", inviteCode);
            const jid = metadata.id;

            await conn.newsletterReactions(jid, serverId, emoji);
            m.reply(`✅ Reacción enviada a:\n*ID:* ${serverId}\n*Canal:* ${metadata.name}`);

        } catch (e) {
            m.reply(`❌ Error: Verifica que el bot siga el canal o que el link sea válido.\n\n${e.message}`);
        }
    }
};

export default h;
