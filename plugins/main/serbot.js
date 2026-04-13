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
        let targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') : senderId.split('@')[0];
        let targetJid = targetNum + '@s.whatsapp.net';

        const instructions = `『 *${name()}* 』\n\n✦ 1. DISPOSITIVOS VINCULADOS\n✦ 2. VINCULAR CON NÚMERO\n✦ 3. INGRESAR EL CÓDIGO ENVIADO\n\n*SOLICITUD PARA:*\n@${targetNum}\n\n† *NOTA:* este código vence en 8 segundos y solo es válido para @${targetNum}`;

        await conn.sendMessage(m.chat, {
            image: { url: global.img() },
            caption: instructions,
            mentions: [targetJid],
            contextInfo: {
                ...channelInfo
            }
        }, { quoted: m });

        await startSubBot(m, conn, targetNum);
    }
};

export default serbot;
