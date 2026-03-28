import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command }) => {
        const groupOfficial = '120363407713231046@g.us';
        const groupLink = 'https://chat.whatsapp.com/CkizHMducS3H0wYsmuCHU6';

        let groupMetadata;
        try {
            groupMetadata = await conn.groupMetadata(groupOfficial);
        } catch {
            groupMetadata = null;
        }

        const senderId = jidNormalizedUser(m.sender);
        const isMember = groupMetadata ? groupMetadata.participants.some(p => jidNormalizedUser(p.id) === senderId) : false;

        if (!isMember) {
            const accessDenied = `*ACCESO RESTRINGIDO*\n\n` +
                                 `ESTE COMANDO SE ENCUENTRA DISPONIBLE ÚNICAMENTE PARA MIEMBROS DE NUESTRA COMUNIDAD OFICIAL.\n\n` +
                                 `*ENLACE DE ACCESO*\n` +
                                 `${groupLink}\n\n` +
                                 `EL USO DE ESTE SISTEMA REQUIERE PERTENECER AL GRUPO PARA EVITAR SATURACIÓN POR SOLICITUDES NO AUTORIZADAS.`;

            return await conn.sendMessage(m.chat, {
                text: accessDenied,
                contextInfo: {
                    externalAdReply: {
                        title: global.name(),
                        body: 'ACCESO DENEGADO',
                        mediaType: 1,
                        thumbnailUrl: global.img(),
                        sourceUrl: 'https://dix.lat',
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
        }

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
                             `┃  PUEDES VINCULAR OTRO NÚMERO\n` +
                             `┃  USANDO: ${usedPrefix}${command} NÚMERO\n` +
                             `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await conn.sendMessage(m.chat, {
            image: { url: global.img() },
            caption: instructions
        }, { quoted: m });

        await startSubBot(m, conn, targetId);
    }
};

export default serbot;
