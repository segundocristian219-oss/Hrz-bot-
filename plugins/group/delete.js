const deleteCommand = {
    name: 'delete',
    alias: ['del', 'd', 'borrar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            if (m.quoted) {
                return await conn.sendMessage(m.chat, { 
                    delete: { 
                        remoteJid: m.chat, 
                        fromMe: m.quoted.fromMe, 
                        id: m.quoted.id, 
                        participant: m.quoted.sender 
                    } 
                });
            }

            if (text && !isNaN(text)) {
                const count = Math.min(parseInt(text), 20);
                if (count <= 0) return;

                const fetch = await conn.fetchMessagesFromWA(m.chat, count);
                const filter = fetch.filter(v => v.key.fromMe || v.participant);

                for (const msg of filter) {
                    await conn.sendMessage(m.chat, { 
                        delete: msg.key 
                    }).catch(() => null);
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
