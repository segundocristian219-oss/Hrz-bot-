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
            txt += `*${i + 1}.* @${jid} (${name})\n`;
        });

        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: activeBots.map(sock => sock.user.id) 
        }, { quoted: m });
    }
};

export default bots;
