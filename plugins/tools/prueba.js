const inspectCommand = {
    name: 'inspect',
    alias: ['ver', 'estructura', 'json'],
    category: 'admin',
    run: async (m, { conn }) => {
        if (m.quoted) {
            const quotedMessage = m.quoted.message;
            const structure = JSON.stringify(quotedMessage, null, 2);
            
            await conn.sendMessage(m.chat, { 
                text: '🔍 *ESTRUCTURA DETECTADA:*\n\n```' + structure + '```' 
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { 
                text: '❌ Responde a un mensaje para analizar su construcción.' 
            });
        }
    }
};

export default inspectCommand;
