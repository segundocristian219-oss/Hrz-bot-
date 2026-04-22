import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const clean = {
    name: 'cleansub',
    alias: ['limpiarsub', 'purga'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        if (!isOwner) return;

        const jadibtsPath = path.join(process.cwd(), 'jadibts');
        if (!fs.existsSync(jadibtsPath)) return m.reply('❌ No existe la carpeta de sub-bots.');

        const folders = fs.readdirSync(jadibtsPath);
        let count = 0;
        let dbCleaned = 0;

        await m.reply(`🧹 *Iniciando purga de sesiones fantasma...*\nAnalizando ${folders.length} carpetas.`);

        for (const id of folders) {
            const folderPath = path.join(jadibtsPath, id);
            const credsPath = path.join(folderPath, 'creds.json');
            
            try {
                const jid = `${id}@s.whatsapp.net`;
                const botInDb = await global.SubBotSettings.findOne({ botId: jidNormalizedUser(jid) });

                let deleteThis = false;

                if (!fs.existsSync(credsPath)) {
                    deleteThis = true; 
                } else if (!botInDb || botInDb.status === false) {
                    deleteThis = true; 
                }

                if (deleteThis) {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                    count++;
                }
            } catch (e) {
                console.error(`Error procesando carpeta ${id}:`, e);
            }
        }

        const allInDb = await global.SubBotSettings.find();
        for (const bot of allInDb) {
            const folderName = bot.botId.split('@')[0];
            const folderExists = fs.existsSync(path.join(jadibtsPath, folderName));
            
            if (!folderExists) {
                await global.SubBotSettings.deleteOne({ botId: bot.botId });
                dbCleaned++;
            }
        }

        let report = `✅ *PURGA COMPLETADA*\n\n`;
        report += `🗑️ Carpetas borradas: ${count}\n`;
        report += `🗂️ Registros DB eliminados: ${dbCleaned}\n`;
        report += `✨ Sistema optimizado.`;

        await m.reply(report);
    }
};

export default clean;
