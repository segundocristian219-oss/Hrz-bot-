import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../lib/serbot.js';

const serbot = {
    name: 'serbot',
    alias: ['code', 'subbot', 'jadibot'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command }) => {
        const MAX_SUBBOTS = 45;
        const activeCount = (global.conns || []).filter(sock => sock.user && sock.user.id).length;

        if (activeCount >= MAX_SUBBOTS) {
            const donationMsg = `*CAPACIDAD LLENA*\n\nNo se encontraron más espacios disponibles para subbots, por favor haga una donación para subir la capacidad.\n\nhttps://kirito.dix.lat/donations`;
            
            return await conn.sendMessage(m.chat, {
                image: { url: global.img() },
                caption: donationMsg,
                  contextInfo: {
                    ...channelInfo
               }
            }, { quoted: m });
        }

        const senderId = jidNormalizedUser(m.sender);
        let targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') : senderId.split('@')[0];
        let targetJid = targetNum + '@s.whatsapp.net';

        const instructions = `『 SERBOT 』\n\n✦ 1. DISPOSITIVOS VINCULADOS\n✦ 2. VINCULAR CON NÚMERO\n✦ 3. INGRESAR EL CÓDIGO ENVIADO\n\n*SOLICITUD PARA:*\n@${targetNum}\n\n† NOTA: este código vence en 8 segundos y solo es válido para @${targetNum}\n\n*CAPACIDAD:* ${activeCount}/${MAX_SUBBOTS}`;

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
