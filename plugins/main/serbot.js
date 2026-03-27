import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot', 'serbot'],
    category: 'main',
    run: async (m, { conn, usedPrefix, command }) => {
        const id = m.sender.split('@')[0];

        if (global.conns.some(c => c.user && c.user.id.split(':')[0] === id)) {
            return m.reply(`⚠️ *@${id}*, ya tienes una sesión activa en este momento.`);
        }

        const info = `┏━━━━ 「 **INSTRUCCIONES** 」 ━━━━┓\n` +
                     `┃\n` +
                     `┃ 1. Ve a **Dispositivos vinculados**.\n` +
                     `┃ 2. Selecciona **Vincular con número**.\n` +
                     `┃ 3. Ingresa el código que te enviaré.\n` +
                     `┃\n` +
                     `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await m.reply(info);
        
        await startSubBot(m, conn, id);
    }
};

export default serbot;
