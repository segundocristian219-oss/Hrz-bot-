import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot', 'serbot'],
    category: 'main',
    run: async (m, { conn, usedPrefix, command }) => {
        const id = m.sender.split('@')[0];
        const groupOfficial = '120363407713231046@g.us';
        const groupLink = 'https://chat.whatsapp.com/CkizHMducS3H0wYsmuCHU6';

        const groupMetadata = await conn.groupMetadata(groupOfficial).catch(() => null);
        const isMember = groupMetadata ? groupMetadata.participants.some(p => p.id === m.sender) : false;

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
                        title: name(),
                        body: "COMUNIDAD OFICIAL",
                        sourceUrl: groupLink,
                        thumbnailUrl: global.img(),
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        }

        const instructions = `┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                             `┃  *SISTEMA SUB-BOT* ┃\n` +
                             `┃\n` +
                             `┃  1. DISPOSITIVOS VINCULADOS\n` +
                             `┃  2. VINCULAR CON CÓDIGO\n` +
                             `┃  3. INGRESAR EL TOKEN ENVIADO\n` +
                             `┃\n` +
                             `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await m.reply(instructions);
        await startSubBot(m, conn, id);
    }
};

export default serbot;
