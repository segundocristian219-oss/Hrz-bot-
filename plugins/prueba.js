const bots = {
    name: 'listasubbots',
    alias: ['subbots', 'bots', 'listasub'],
    category: 'main',
    run: async (m, { conn }) => {
        if (!global.conns || global.conns.length === 0) {
            return m.reply('❌ No hay sub-bots activos en este momento.');
        }

        const activeBots = global.conns.filter(sock => sock.user && sock.user.id);

        if (activeBots.length === 0) {
            return m.reply('❌ No hay sub-bots conectados actualmente.');
        }

        let txt = `✨ *SUB-BOTS ACTIVOS* ✨\n\n`;
        txt += `Total: ${activeBots.length}\n\n`;

        activeBots.forEach((sock, i) => {
            const jid = sock.user.id.split(':')[0];
            const name = sock.user.name || 'Sub-Bot';
            
            // Creamos el número enmascarado (Ej: 50499...12)
            const maskedNumber = jid.slice(0, 5) + '...' + jid.slice(-2);
            
            // Usamos el número enmascarado en el texto, pero el JID completo va en mentionedJid
            txt += `*${i + 1}.* @${maskedNumber} (${name})\n`;
        });

        await conn.sendMessage(m.chat, { 
            text: txt,
            contextInfo: { 
                mentionedJid: activeBots.map(sock => sock.user.id) 
            }
        }, { quoted: m });
    }
};

export default bots;
