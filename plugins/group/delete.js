const deleteCommand = {
    name: 'delete',
    alias: ['del', 'd', 'borrar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            if (m.quoted) {
                const participant = m.message?.extendedTextMessage?.contextInfo?.participant || m.quoted.sender;
                const stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId || m.quoted.id;

                await conn.sendMessage(m.chat, { 
                    delete: { 
                        remoteJid: m.chat, 
                        fromMe: m.quoted.fromMe, 
                        id: stanzaId, 
                        participant: participant 
                    } 
                });

                const count = parseInt(text);
                if (!isNaN(count) && count > 1) {
                    const limit = Math.min(count - 1, 20);
                    const messages = conn.store?.messages[m.chat]?.array || [];
                    const userMessages = messages
                        .filter(v => (v.key.participant || v.participant) === participant)
                        .slice(-limit);

                    for (const msg of userMessages.reverse()) {
                        await conn.sendMessage(m.chat, { delete: msg.key }).catch(() => null);
                    }
                }
                return;
            }

            const count = parseInt(text);
            if (!isNaN(count) && count > 0) {
                const limit = Math.min(count, 20);
                const messages = conn.store?.messages[m.chat]?.array || [];
                const toDelete = messages.slice(-limit);

                for (const msg of toDelete.reverse()) {
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
