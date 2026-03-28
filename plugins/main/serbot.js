import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command }) => {
        const groupOfficial = '120363407713231046@g.us';
        const groupLink = 'https://chat.whatsapp.com/CkizHMducS3H0wYsmuCHU6';

        if (m.chat !== groupOfficial) {
            const onlyInGroup = `*COMANDO RESTRINGIDO*\n\n` +
                                 `ESTE COMANDO SOLO PUEDE SER EJECUTADO DENTRO DEL GRUPO OFICIAL.\n\n` +
                                 `*UNIRSE AQUÍ:*\n` +
                                 `${groupLink}`;

            return await conn.sendMessage(m.chat, {
                text: onlyInGroup,
                contextInfo: {
                    externalAdReply: {
                        title: global.name(),
                        body: 'OPERACIÓN DENEGADA',
                        mediaType: 1,
                        thumbnailUrl: global.img(),
                        sourceUrl: 'https://dix.lat',
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
