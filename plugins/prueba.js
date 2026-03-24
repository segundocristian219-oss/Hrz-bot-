const bots = {
    name: 'listasubbots',
    alias: ['subbots', 'bots', 'listasub'],
    category: 'main',
    run: async (m, { conn }) => {
        // Usamos global.conns que es donde Baileys suele guardar las conexiones de sub-bots
        if (!global.conns || global.conns.length === 0) {
            return m.reply('❌ No hay sub-bots activos en este momento.');
        }

        // Filtramos solo los que tienen una sesión válida
        const activeBots = global.conns.filter(sock => sock.user && sock.user.id);

        if (activeBots.length === 0) {
            return m.reply('❌ No hay sub-bots conectados actualmente.');
        }

        let txt = `✨ *SUB-BOTS ACTIVOS* ✨\n\n`;
        txt += `Total: ${activeBots.length}\n\n`;

        // Extraemos los JIDs para las menciones
        const mentions = activeBots.map(sock => sock.user.id);

        activeBots.forEach((sock, i) => {
            const jid = sock.user.id.split(':')[0]; // El número puro
            const name = sock.user.name || 'Sub-Bot';

            // IMPORTANTE: Para que brille en azul, el texto DEBE ser el número completo
            // Si quieres que se vea "limpio", lo mejor es poner el número tal cual
            txt += `*${i + 1}.* @${jid} (${name})\n`;
        });

        txt += `\n_Voker Systems • Deylin_`;

        await conn.sendMessage(m.chat, { 
            text: txt,
            contextInfo: { 
                mentionedJid: mentions,
                // Esto ayuda a que el mensaje se vea más "oficial"
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363305113111051@newsletter',
                    newsletterName: 'Voker Updates',
                    serverMessageId: -1
                }
            }
        }, { quoted: m });
    }
};

export default bots;
