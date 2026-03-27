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
                    const fetch = await conn.fetchMessagesFromWA(m.chat, 50);
                    const userMessages = fetch
                        .filter(v => (v.key.participant || v.participant) === participant)
                        .slice(-limit);

                    for (const msg of userMessages) {
                        await conn.sendMessage(m.chat, { delete: msg.key }).catch(() => null);
                    }
                }
                return;
            }

            if (text && !isNaN(text)) {
                const count = Math.min(parseInt(text), 20);
                const fetch = await conn.fetchMessagesFromWA(m.chat, count);
                for (const msg of fetch) {
                    await conn.sendMessage(m.chat, { delete: msg.key }).catch(() => null);
                }
                return;
            }

            await m.react('❓');
        } catch (e) {
            console.error(e);
            await m.react('❌');
        }
    }
}

export default deleteCommand;
