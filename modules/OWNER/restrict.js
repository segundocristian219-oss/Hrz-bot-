import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const resModeModule = {
    category: 'owner',
    commands: {
        resmode: {
            name: 'resmode',
            alias: ['modores', 'restrictmode'],
            rowner: true,
            run: async (m, { conn, text, args, usedPrefix, command }) => {
                const cleanJid = (jid) => {
                    if (!jid) return '';
                    return jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
                };

                let action = '';
                let targetInput = '';

                if (args[0] === 'on' || args[0] === 'off') {
                    action = args[0].toLowerCase();
                    targetInput = args.slice(1).join(' ');
                } else if (args[1] === 'on' || args[1] === 'off') {
                    action = args[1].toLowerCase();
                    targetInput = args[0];
                } else {
                    action = args[0] ? args[0].toLowerCase() : '';
                    targetInput = '';
                }

                let targetJid = '';
                if (m.quoted) {
                    targetJid = cleanJid(m.quoted.sender);
                } else if (m.mentionedJid && m.mentionedJid[0]) {
                    targetJid = cleanJid(m.mentionedJid[0]);
                } else if (targetInput) {
                    let cleanNum = targetInput.replace(/\D/g, '');
                    targetJid = cleanNum + '@s.whatsapp.net';
                } else {
                    targetJid = cleanJid(conn.user.id);
                }

                const botId = cleanJid(conn.user.id);

                if (targetJid !== botId) {
                    return m.reply(`> ❒ El JID ${targetJid} no pertenece a la conexión principal del servidor. Este comando solo es para la conexión principal (${botId}).`);
                }

                if (action !== 'on' && action !== 'off') {
                    const cacheData = global.restrictionsCache?.get(botId);
                    const isRestricted = cacheData ? cacheData.restrictedMode : false;
                    return m.reply(`> ❒ *Estado de Restricción de la Conexión Principal*\n\n• *Bot:* ${botId}\n• *Estado:* ${isRestricted ? '✅ RESTRICCIONES ACTIVAS' : '❌ SIN RESTRICCIONES'}\n\n_Para cambiar el estado usa: ${usedPrefix + command} [on/off]_`);
                }

                const isActivating = action === 'on';
                const currentData = global.restrictionsCache?.get(botId) || { hiddenCommands: new Set() };

                const success = await global.updateBotRestrictions(botId, {
                    restrictedMode: isActivating,
                    hiddenCommands: Array.from(currentData.hiddenCommands || [])
                });

                if (success) {
                    return m.reply(`> ❒ *Configuración de Modo Actualizada*\n\n• *Bot:* ${botId}\n• *Estado:* ${isActivating ? '✅ RESTRICCIONES ACTIVAS' : '❌ SIN RESTRICCIONES'}`);
                } else {
                    return m.reply(`> ❒ Ocurrió un error al guardar la configuración en la base de datos.`);
                }
            }
        }
    }
};
