const deleteCommand = {
    name: 'delete',
    alias: ['del', 'd', 'borrar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            if (m.quoted) {
                const key = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };
                return await conn.sendMessage(m.chat, { delete: key });
            }

            const count = parseInt(text);
            if (!isNaN(count) && count > 0) {
                const limit = Math.min(count, 20);
                const messages = await conn.store?.messages[m.chat]?.array?.slice(-limit) || [];
                
                for (const msg of messages.reverse()) {
                    await conn.sendMessage(m.chat, { delete: msg.key }).catch(() => null);
                }
                return await m.react('🗑️');
            }

            await m.react('❓');
        } catch (e) {
            console.error(e);
            await m.react('❌');
        }
    }
}

export default deleteCommand;
