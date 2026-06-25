import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot } from '../../core/serbot.js';

const i = global.img(conn);

export const serbotCommand = {
    category: 'main',
    commands: {
        serbot: {
            name: 'serbot',
            alias: ['code'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                try {
                    await m.react('⏳');
                    const MAX_SUBBOTS = 40;
                    const activeCount = global.conns ? global.conns.size : 0;

                    if (activeCount >= MAX_SUBBOTS) {
                        const botones = [
                            { text: '🌐 Visitar Web', url: 'https://dix.lat/planes' }
                        ];
                        const opciones = {
                            title: "亗  CAPACIDAD LLENA  亗",
                            footer: "Planes VIP Disponibles",
                            quoted: m,
                            image: i
                        };
                        return await conn.sendButtonMessage(m.chat, `No se encontraron espacios gratuitos disponibles en este momento.\n\n> *Planes VIP Disponibles:*\n> • Vinculación Premium: $10 USD / 1er mes\n> • Pase Anual Premium: $60 USD / Año\n> • Pase Trimestral Gold: $20 USD / 3 meses`, botones, opciones);
                    }

                    const senderId = m.sender ? jidNormalizedUser(m.sender) : '';
                    if (!senderId) return;

                    let targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') : (senderId.split('@')[0] || '');
                    let targetJid = targetNum + '@s.whatsapp.net';

                    const code = await startSubBot(m, conn, targetNum, { isCode: false });

                    if (code && typeof code === 'string') {
                        const instructions = `亗  *KIRITO SERBOT* 亗\n\n༂ꦽ  ① DISPOSITIVOS VINCULADOS\n༂ꦽ  ② VINCULAR CON NÚMERO\n༂ꦽ  ③ INGRESAR EL CÓDIGO\n\n✰ *SOLICITUD:* @${targetNum}\n✰ *CAPACIDAD:* ${activeCount}/${MAX_SUBBOTS}\n\n『───┈┈┈┈┄┄╌╌╌╌┄┄┈┈┈┈───』\n\n⚠ *NOTA:* El código vence en 8 segundos y es único para @${targetNum}\nᰔᩚ *INFO:* Usa \`#reglas-subbot\` para los términos.\n\n『───┈┈┈┈┄┄╌╌╌╌┄┄┈┈┈┈───』\n\nTu código de vinculación es: *${code}*`;

                        const botonesUnificados = [
                            { text: '📋 Copiar Código', copy: code },
                            { text: '📜 Ver Reglas', id: '.reglas-subbot' }
                        ];

                        const opcionesUnificadas = {
                            title: "VINCULACIÓN DE SUB-BOT",
                            footer: "Kirito-Bot MD",
                            quoted: m,
                            image: i
                        };
                        await m.react('✅');

                        await conn.sendButtonMessage(m.chat, instructions, botonesUnificados, opcionesUnificadas);
                    }
                } catch (err) {
                    console.error(err);
                    await m.reply("Error en la ejecución del comando serbot:\n\n" + err.message);
                }
            }
        }
    }
};
