import fs from 'fs';
import path from 'path';

const bots = {
    name: 'listasubbots',
    alias: ['subbots', 'bots', 'listasub'],
    category: 'main',
    run: async (m, { conn }) => {
        try {
            const allSettings = await global.SubBotSettings.find({ status: true });

            if (!allSettings || allSettings.length === 0) {
                return m.reply('❌ No hay sub-bots activos en la base de datos.');
            }

            const jadibtsPath = path.join(process.cwd(), 'jadibts');
            
            const realBots = allSettings.filter(bot => {
                const jid = bot.botId.split('@')[0];
                const sessionFolder = path.join(jadibtsPath, jid);
                return fs.existsSync(path.join(sessionFolder, 'creds.json'));
            });

            if (realBots.length === 0) {
                return m.reply('❌ No hay sub-bots con sesiones activas en el servidor.');
            }

            let txt = `✨ *SUB-BOTS ACTIVOS (REAL-TIME)* ✨\n\n`;
            txt += `Total en red: ${realBots.length}\n`;
            txt += `Nodos de procesamiento: 4\n\n`;

            realBots.forEach((bot, i) => {
                const jid = bot.botId.split('@')[0];
                const name = bot.botName || 'Kirito - SubBot';
                const maskedNumber = jid.slice(0, 5) + '...' + jid.slice(-2);
                txt += `*${i + 1}.* ${maskedNumber} - ${name}\n`;
            });

            txt += `\n> Se han filtrado ${allSettings.length - realBots.length} sesiones inactivas.`;

            await conn.sendMessage(m.chat, { 
                text: txt,
                contextInfo: { 
                    externalAdReply: {
                        title: 'KIRITO BOT - NETWORK STATUS',
                        body: `Carga distribuida: OK`,
                        mediaType: 1,
                        thumbnailUrl: 'https://api.dix.lat/media2/1773637281084.jpg',
                        sourceUrl: 'https://dix.lat'
                    }
                }
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error al sincronizar la lista de sub-bots.');
        }
    }
};

export default bots;
