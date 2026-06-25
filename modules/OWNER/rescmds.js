import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const resCmdsModule = {
    category: 'owner',
    commands: {
        rescmds: {
            name: 'rescmds',
            alias: ['cmdsres', 'restrictcmds'],
            rowner: true,
            run: async (m, { conn, text, args, usedPrefix, command }) => {
                const cleanJid = (jid) => {
                    if (!jid) return '';
                    return jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
                };

                let targetInput = '';
                let commandText = '';

                if (m.quoted) {
                    targetInput = m.quoted.sender;
                    commandText = text;
                } else if (m.mentionedJid && m.mentionedJid[0]) {
                    targetInput = m.mentionedJid[0];
                    commandText = text.replace(/@\d+/g, '').trim();
                } else if (args[0] && (args[0].match(/^\d+$/) || args[0].includes('@'))) {
                    targetInput = args[0];
                    commandText = args.slice(1).join(' ');
                } else {
                    targetInput = conn.user.id;
                    commandText = text;
                }

                const targetJid = cleanJid(targetInput);
                const botId = cleanJid(conn.user.id);

                if (targetJid !== botId) {
                    return m.reply(`> ❒ El JID ${targetJid} no pertenece a la conexión principal del servidor. Este comando solo es para la conexión principal (${botId}).`);
                }

                const cacheData = global.restrictionsCache?.get(botId) || { restrictedMode: false, hiddenCommands: new Set() };

                if (!commandText) {
                    const list = Array.from(cacheData.hiddenCommands || new Set());
                    return m.reply(`> ❒ *Comandos Restringidos Actualmente (Conexión Principal)*\n\n• *Bot:* ${botId}\n• *Lista:* [ ${list.join(', ') || 'Ninguno'} ]\n\n_Para cambiar la lista usa: ${usedPrefix + command} cmd1,cmd2,cmd3_`);
                }

                const hiddenCommandsArray = commandText.split(',').map(c => c.trim().toLowerCase()).filter(c => c);
                const hiddenCommandsSet = new Set(hiddenCommandsArray);

                const success = await global.updateBotRestrictions(botId, {
                    restrictedMode: cacheData.restrictedMode,
                    hiddenCommands: Array.from(hiddenCommandsSet)
                });

                if (success) {
                    if (global.restrictionsCache) {
                        global.restrictionsCache.set(botId, {
                            restrictedMode: cacheData.restrictedMode,
                            hiddenCommands: hiddenCommandsSet
                        });
                    }
                    return m.reply(`> ❒ *Lista de Comandos Restringidos Actualizada (Conexión Principal)*\n\n• *Bot:* ${botId}\n• *Nuevos Ocultos:* [ ${hiddenCommandsArray.join(', ') || 'Ninguno'} ]\n• *Estado Global:* ${cacheData.restrictedMode ? '✅ RESTRICCIONES ACTIVAS' : '❌ MODO INACTIVO (Actívalo con .resmode on)'}`);
                } else {
                    return m.reply(`> ❒ Ocurrió un error al guardar los comandos en la base de datos.`);
                }
            }
        }
    }
};
