import { startSubBot } from '../../lib/serbot.js';

const handler = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, usedPrefix, command }) => {
        const id = m.sender.split('@')[0];
        
        const info = `┏━━━━ 「 INSTRUCCIONES 」 ━━━━┓\n` +
                     `┃ 1. Ve a Dispositivos vinculados.\n` +
                     `┃ 2. Vincular con número de teléfono.\n` +
                     `┃ 3. Espera el código que enviaré.\n` +
                     `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await m.reply(info);
        await startSubBot(m, conn, id);
    }
};

export default handler;
