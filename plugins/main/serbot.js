import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command, isPremiumBot }) => {
        const groupOfficial = '120363407713231046@g.us';
        const groupLink = 'https://chat.whatsapp.com/CkizHMducS3H0wYsmuCHU6';


        const senderId = jidNormalizedUser(m.sender);
        let targetId = args[0] ? args[0].replace(/[^0-9]/g, '') : senderId.split('@')[0];

        const instructions = ` *SISTEMA VINCULACIÓN* \n` +
                             `\n` +
                             ` 1. DISPOSITIVOS VINCULADOS\n` +
                             ` 2. VINCULAR CON NÚMERO\n` +
                             ` 3. INGRESAR EL TOKEN ENVIADO\n` +
                             `\n` +
                             ` *SOLICITUD PARA:*\n` +
                             ` ${targetId}\n` +
                             `\n` +
                             `> *NOTA:*\n` +
                             `> Esté código vence en 8 segundos y solo es válido para ${targetId}`;

        await conn.sendMessage(m.chat, {
            image: { url: global.img() },
            caption: instructions,
            contextinfo: {
              ...channelInfo
          }
        }, { quoted: m });

        await startSubBot(m, conn, targetId);
    }
};

export default serbot;
