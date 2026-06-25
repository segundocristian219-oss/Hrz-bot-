import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const adminSubBotModule = {
    category: 'owner',
    commands: {
        'premium-manager': {
            name: 'premium-manager',
            alias: ['setpremium', 'delpremium', 'listsubbots', 'cleandb', 'listprem'],
            rowner: true,
            run: async (m, { conn, text, command, usedPrefix }) => {
                const botJid = jidNormalizedUser(conn.user.id);
                const isMainBot = botJid === jidNormalizedUser(global.conn?.user?.id);

                if (!isMainBot) {
                    return conn.reply(m.chat, '> ❒ Este comando de administración global solo se puede ejecutar desde el Bot Principal.', m);
                }

                const rawConns = global.conns ? (Array.isArray(global.conns) ? global.conns : Array.from(global.conns.values())) : [];
                const activeJids = rawConns
                    .map(c => c.user?.id ? jidNormalizedUser(c.user.id) : null)
                    .filter(jid => jid && jid !== botJid);

                const ahora = Date.now();

                for (const jid of activeJids) {
                    let config = global.subbotConfig[jid];
                    if (!config) {
                        const dbData = await global.SubBotSettings.findOne({ botId: jid }).lean();
                        if (dbData) {
                            global.subbotConfig[jid] = dbData;
                            config = dbData;
                        }
                    }
                    if (config?.isprem && config?.ispremExpires && ahora > config.ispremExpires) {
                        await global.SubBotSettings.updateOne({ botId: jid }, { $set: { isprem: false, ispremExpires: null } });
                        config.isprem = false;
                        config.ispremExpires = null;
                        global.subbotConfig[jid] = config;
                        const inst = rawConns.find(c => c.user?.id && jidNormalizedUser(c.user.id) === jid);
                        if (inst) inst.settings = config;
                    }
                }

                if (command === 'cleandb') {
                    const totalAntes = await global.SubBotSettings.countDocuments();
                    await global.SubBotSettings.deleteMany({ botId: { $nin: activeJids } });
                    const keysConfig = Object.keys(global.subbotConfig || {});
                    for (const key of keysConfig) {
                        if (key !== botJid && !activeJids.includes(key)) {
                            delete global.subbotConfig[key];
                        }
                    }
                    const totalDespues = await global.SubBotSettings.countDocuments();
                    return conn.reply(m.chat, `> 🧹 *LIMPIEZA DE BASE DE DATOS COMPLETA*\n\n* Registros antes: ${totalAntes}\n* Registros activos: ${totalDespues}\n* Eliminados: ${totalAntes - totalDespues}`, m);
                }

                if (command === 'listprem') {
                    const premiums = activeJids.filter(jid => global.subbotConfig[jid]?.isprem === true);
                    if (premiums.length === 0) {
                        return conn.reply(m.chat, '> ❒ No hay ningún subbot con rango Premium activo en la red.', m);
                    }
                    let txt = `┏━━〔 SUBBOTS PREMIUM ACTIVOS 〕━━┓\n┃\n`;
                    premiums.forEach((jid, index) => {
                        const config = global.subbotConfig[jid] || {};
                        const num = jid.split('@')[0];
                        const rest = config.ispremExpires ? Math.round((config.ispremExpires - ahora) / (1000 * 60)) : 0;
                        let tiempoTxt = 'Indefinido';
                        if (rest > 0) {
                            if (rest >= 1440) {
                                tiempoTxt = `${Math.round(rest / 1440)} días`;
                            } else if (rest >= 60) {
                                tiempoTxt = `${Math.round(rest / 60)} horas`;
                            } else {
                                tiempoTxt = `${rest} minutos`;
                            }
                        }
                        txt += `┃ *[ ${index + 1} ]* — @${num}\n┃ ↳ *Tag:* ${config.botName || 'SubBot'}\n┃ ↳ *Restan:* ${tiempoTxt}\n┃\n`;
                    });
                    txt += `┗━━━━━━━━━━━━━━━━━━━━━━━┛`;
                    return conn.reply(m.chat, txt, m, { mentions: premiums });
                }

                if (command === 'listsubbots' || command === 'premium-manager' || (!text && (command === 'setpremium' || command === 'delpremium'))) {
                    if (activeJids.length === 0) {
                        return conn.reply(m.chat, '> ❒ No hay subbots conectados a la infraestructura en este momento.', m);
                    }

                    const premiums = [];
                    const freebots = [];

                    activeJids.forEach(jid => {
                        const config = global.subbotConfig[jid] || {};
                        const botData = { jid, name: config.botName || 'SubBot Activo', expires: config.ispremExpires || null };
                        if (config.isprem === true) {
                            premiums.push(botData);
                        } else {
                            freebots.push(botData);
                        }
                    });

                    let menu = `┏━━〔 INFRAESTRUCTURA SUBBOTS 〕━━┓\n┃\n`;
                    let globalIndex = 1;
                    const globalMapping = {};

                    menu += `┣👑 *PREMIUMS ACTIVOS* (${premiums.length})\n`;
                    if (premiums.length === 0) {
                        menu += `┃ ↳ _No hay instancias premium_\n┃\n`;
                    } else {
                        premiums.forEach(bot => {
                            const num = bot.jid.split('@')[0];
                            globalMapping[globalIndex] = bot.jid;
                            const rest = bot.expires ? Math.round((bot.expires - ahora) / (1000 * 60)) : 0;
                            let tiempoTxt = 'Indefinido';
                            if (rest > 0) {
                                if (rest >= 1440) tiempoTxt = `${Math.round(rest / 1440)} d`;
                                else if (rest >= 60) tiempoTxt = `${Math.round(rest / 60)} h`;
                                else tiempoTxt = `${rest} m`;
                            }
                            menu += `┃ *[ ${globalIndex} ]* — @${num}\n┃ ↳ *Tag:* ${bot.name}\n┃ ↳ *Faltan:* ${tiempoTxt}\n`;
                            globalIndex++;
                        });
                        menu += `┃\n`;
                    }

                    menu += `┣🆓 *SUBBOTS GRATUITOS* (${freebots.length})\n`;
                    if (freebots.length === 0) {
                        menu += `┃ ↳ _No hay instancias gratuitas_\n┃\n`;
                    } else {
                        freebots.forEach(bot => {
                            const num = bot.jid.split('@')[0];
                            globalMapping[globalIndex] = bot.jid;
                            menu += `┃ *[ ${globalIndex} ]* — @${num}\n┃ ↳ *Tag:* ${bot.name}\n`;
                            globalIndex++;
                        });
                        menu += `┃\n`;
                    }

                    menu += `┣━━〔 PANEL DE CONTROL 〕━━┓\n┃\n`;
                    menu += `┃ ✎ *Asignar Premium con Tiempo:*\n┃ ↳ ${usedPrefix}setpremium [Index] | [1m/1h/1d]\n┃\n`;
                    menu += `┃ ✎ *Ver Solo Premiums:*\n┃ ↳ ${usedPrefix}listprem\n┃\n`;
                    menu += `┃ ✎ *Remover Premium:*\n┃ ↳ ${usedPrefix}delpremium [Index]\n┃\n`;
                    menu += `┃ ✎ *Depurar Base de Datos:*\n┃ ↳ ${usedPrefix}cleandb\n┗━━━━━━━━━━━━━━━━━━┛`;

                    global.currentAdminMapping = globalMapping;
                    return conn.reply(m.chat, menu, m, { mentions: activeJids });
                }

                let partes = text.split('|');
                let targetParam = partes[0].trim();
                let tiempoParam = partes[1] ? partes[1].trim().toLowerCase() : null;

                let targetJid = targetParam;
                const inputIndex = parseInt(targetJid);

                if (!isNaN(inputIndex) && global.currentAdminMapping && global.currentAdminMapping[inputIndex]) {
                    targetJid = global.currentAdminMapping[inputIndex];
                } else {
                    if (!targetJid.includes('@s.whatsapp.net')) {
                        targetJid = `${targetJid.replace(/\D/g, '')}@s.whatsapp.net`;
                    }
                }

                const isConnected = activeJids.includes(targetJid);
                if (!isConnected) {
                    return conn.reply(m.chat, `> ✖ El identificador seleccionado no se encuentra activo en la red.`, m);
                }

                const isActivating = command === 'setpremium';
                let tiempoExpiracion = null;

                if (isActivating) {
                    let ms = 7 * 24 * 60 * 60 * 1000;
                    if (tiempoParam) {
                        const match = tiempoParam.match(/^(\d+)([mhd])$/);
                        if (match) {
                            const valor = parseInt(match[1]);
                            const unidad = match[2];
                            if (unidad === 'm') ms = valor * 60 * 1000;
                            if (unidad === 'h') ms = valor * 60 * 60 * 1000;
                            if (unidad === 'd') ms = valor * 24 * 60 * 60 * 1000;
                        }
                    }
                    tiempoExpiracion = Date.now() + ms;
                }

                let settings = await global.SubBotSettings.findOneAndUpdate(
                    { botId: targetJid },
                    { $set: { isprem: isActivating, ispremExpires: tiempoExpiracion } },
                    { new: true, upsert: true }
                );

                if (settings && typeof settings.toObject === 'function') {
                    settings = settings.toObject();
                }

                global.subbotConfig[targetJid] = {
                    ...global.subbotConfig[targetJid],
                    botId: targetJid,
                    botName: settings.botName || 'Kirito',
                    botImage: settings.botImage || global.img(),
                    prefix: settings.prefix || '.',
                    modulos: settings.modulos || { bienvenida: true, despedida: true },
                    isprem: isActivating,
                    ispremExpires: tiempoExpiracion
                };

                const instance = rawConns.find(c => c.user?.id && jidNormalizedUser(c.user.id) === targetJid);
                if (instance) {
                    instance.settings = global.subbotConfig[targetJid];
                }

                const targetNumber = targetJid.split('@')[0];
                const statusMessage = isActivating 
                    ? `> 👑 *Premium Activado Exitosamente*\n\nEl subbot @${targetNumber} ha recibido permisos premium.`
                    : `> 🆓 *Premium Removido*\n\nEl subbot @${targetNumber} ha regresado al estado gratuito.`;

                return conn.reply(m.chat, statusMessage, m, { mentions: [targetJid] });
            }
        }
    }
};
