const handler = {
    name: 'salir',
    alias: ['leavegc', 'salirdelgrupo', 'leave'],
    category: 'owner',
    run: async (conn, m, { text }) => {
        const id = text ? text : m.chat;
        
        const sendReaction = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
        const sendMsg = (text) => conn.sendMessage(m.chat, { text: text }, { quoted: m });

        try {
            await sendReaction('👋');
            
            await sendMsg('*Me despido de este grupo, hasta pronto.*');

            await new Promise(resolve => setTimeout(resolve, 1000));

            
            await conn.groupLeave(id);

        } catch (e) {
            console.error(e);
            await sendReaction('❌');
            
            try {
                sendMsg('❌ Ocurrió un error al intentar salir del grupo.');
            } catch (err) {
                console.log('No se pudo enviar mensaje de error porque el bot ya no está en el chat.');
            }
        }
    }
};

export default handler;
