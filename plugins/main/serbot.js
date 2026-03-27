import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot', 'serbot'],
    category: 'main',
    run: async (m, { conn, usedPrefix, command }) => {
        const id = m.sender.split('@')[0];

        const info = `┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                     `┃  ♛ *MODO SUB-BOT* ♛\n` +
                     `┃\n` +
                     `┃ ➠  Ve a **Dispositivos vinculados**.\n` +
                     `┃ ➠  Selecciona **Vincular con código**.\n` +
                     `┃ ➠  Ingresa el código que te enviaré.\n` +
                     `┃\n` +
                     `┃ ⍰ *Usa el código rápido.*\n` +
                     `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await m.reply(info);
        await startSubBot(m, conn, id);
    }
};

export default serbot;
