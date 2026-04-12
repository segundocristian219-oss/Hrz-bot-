import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command, isPremiumBot }) => {
        const groupOfficial = '120363407713231046@g.us';
        const groupLink = 'https://chat.whatsapp.com/CkizHMducS3H0wYsmuCHU6';

        if (isPremiumBot) {
            const premiumMessage = `*SISTEMA PREMIUM ACTIVO*\n\n` +
                                   `ESTA INSTANCIA DEL BOT ES *PREMIUM* Y NO PERMITE LA CREACIÓN DE SUB-BOTS DIRECTAMENTE.\n\n` +
                                   `SI DESEAS CONVERTIRTE EN SUB-BOT GRATUITO, ÚNETE A NUESTRO GRUPO OFICIAL:\n` +
                                   `${groupLink}`;

            return await conn.sendMessage(m.chat, {
                text: premiumMessage,
                contextInfo: {
                    externalAdReply: {
                        title: '👑 PREMIUM SYSTEM',
                        body: 'SUB-BOTS DESACTIVADOS',
                        mediaType: 1,
                        thumbnailUrl: global.img(),
                        sourceUrl: groupLink,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
        }


        const senderId = jidNormalizedUser(m.sender);
        let targetId = args[0] ? args[0].replace(/[^0-9]/g, '') : senderId.split('@')[0];

        const instructions = `┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                             `┃  *SISTEMA VINCULACIÓN* ┃\n` +
                             `┃\n` +
                             `┃  1. DISPOSITIVOS VINCULADOS\n` +
                             `┃  2. VINCULAR CON NÚMERO\n` +
                             `┃  3. INGRESAR EL TOKEN ENVIADO\n` +
                             `┃\n` +
                             `┃  *SOLICITUD PARA:*\n` +
                             `┃  ${targetId}\n` +
                             `┃\n` +
                             `┃  *NOTA:*\n` +
                             `┃  SOLO VÁLIDO EN ESTE GRUPO\n` +
                             `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await conn.sendMessage(m.chat, {
            image: { url: global.img() },
            caption: instructions
        }, { quoted: m });

        await startSubBot(m, conn, targetId);
    }
};

export default serbot;
