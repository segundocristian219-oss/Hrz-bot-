const bots = {
    name: 'listasubbots',
    alias: ['subbots', 'bots', 'listasub'],
    category: 'main',
    run: async (m, { conn }) => {
        try {
            const allSettings = await global.SubBotSettings.find({ status: true });

            if (!allSettings || allSettings.length === 0) {
                return m.reply('❌ No hay sub-bots registrados o activos en la base de datos.');
            }

            let txt = `✨ *SUB-BOTS ACTIVOS (SISTEMA MULTI-HILO)* ✨\n\n`;
            txt += `Total en red: ${allSettings.length}\n\n`;

            allSettings.forEach((bot, i) => {
                const jid = bot.botId.split('@')[0];
                const name = bot.botName || 'Kirito - SubBot';
                
                const maskedNumber = jid.slice(0, 5) + '...' + jid.slice(-2);
                txt += `*${i + 1}.* ${maskedNumber} - ${name}\n`;
            });

            txt += `\n> El sistema está distribuido en 4 núcleos para mayor estabilidad.`;

            await conn.sendMessage(m.chat, { 
                text: txt,
                contextInfo: { 
                    externalAdReply: {
                        title: 'KIRITO BOT - NETWORK STATUS',
                        body: `Hilos activos: 4`,
                        mediaType: 1,
                        thumbnailUrl: 'https://api.dix.lat/media2/1773637281084.jpg',
                        sourceUrl: 'https://dix.lat'
                    }
                }
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error al obtener la lista de sub-bots.');
        }
    }
};

export default bots;
