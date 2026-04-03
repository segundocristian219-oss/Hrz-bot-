export default {
    // Todos los comandos relacionados al sistema de advertencias
    command: ['warn', 'delwarn', 'warns', 'resetwarn', 'setwarnlimit'],
    category: 'group',
    run: async (client, m, { args, text, participants, isGroup }) => {
        
        // Verificación inicial de grupo
        if (!m.isGroup) return m.reply('🚫 Este comando solo se puede usar en grupos.');

        // Inicializar la base de datos de manera segura
        const db = globalThis.db?.data || global.db?.data;
        const chat = db.chats[m.chat] || (db.chats[m.chat] = {});
        
        // Estructuras por defecto si el grupo es nuevo en el sistema
        if (!chat.warnings) chat.warnings = {};
        if (chat.warnLimit === undefined) chat.warnLimit = 0; // 0 significa desactivado

        const cmd = m.command;
        const prefix = m.prefix || '#';

        // Identificar al usuario afectado (citado o mencionado)
        const who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : null;

        // Comprobación interna de Administradores (evita errores si el framework no lo pasa)
        const groupMetadata = await client.groupMetadata(m.chat);
        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const isAdmin = admins.includes(m.sender);
        const isBotAdmin = admins.includes(client.user.id.split(':')[0] + '@s.whatsapp.net');

        // Formateador de fechas exacto al de tus imágenes
        const getFormattedDate = () => {
            return new Intl.DateTimeFormat('es-VE', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
                timeZone: 'America/Caracas' 
            }).format(new Date());
        };

        // --- SISTEMA DE COMANDOS --- //
        switch (cmd) {
            
            case 'setwarnlimit':
                if (!isAdmin) return m.reply('🚫 *Comando exclusivo para administradores del grupo.*');
                
                const limit = parseInt(args[0]);
                if (isNaN(limit) || limit < 0) {
                    return m.reply(`《✧》 Uso incorrecto. Ingresa un número válido.\nEjemplo: *${prefix}setwarnlimit 5*`);
                }

                chat.warnLimit = limit;
                if (limit === 0) {
                    return m.reply('⛊ Has desactivado la función de eliminar usuarios al alcanzar el límite de advertencias.');
                } else {
                    let limitMsg = `⛊ Límite de advertencias establecido en ${limit} para este grupo.\n`;
                    limitMsg += `❖ Los usuarios serán eliminados automáticamente al alcanzar este límite.`;
                    return m.reply(limitMsg);
                }

            case 'warns':
                if (!who) return m.reply('《✧》 Menciona o responde a un usuario válido para ver sus advertencias.');
                
                const userWarns = chat.warnings[who] || [];
                if (userWarns.length === 0) {
                    return m.reply(`✿ El usuario @${who.split('@')[0]} no tiene advertencias registradas.`, null, { mentions: [who] });
                }

                let warnsVisual = `✿ *Advertencias totales (${userWarns.length}):*\n\n`;
                userWarns.forEach(w => {
                    warnsVisual += `#${w.id} » ${w.reason}\n`;
                    warnsVisual += `| » Fecha: ${w.date}\n\n`;
                });
                
                return m.reply(warnsVisual.trim(), null, { mentions: [who] });

            case 'warn':
                if (!isAdmin) return m.reply('🚫 *Comando exclusivo para administradores del grupo.*');
                if (!who) return m.reply('《✧》 Debes mencionar o responder al usuario que deseas advertir.');

                // Extraer la razón de la advertencia limpiando el texto de menciones
                let cleanReason = text.replace(/@\d+/g, '').trim();
                let reason = cleanReason !== '' ? cleanReason : 'Sin razón.';
                
                if (!chat.warnings[who]) chat.warnings[who] = [];
                
                // Generar el siguiente ID buscando el número más alto y sumando 1
                const nextId = chat.warnings[who].length > 0 ? Math.max(...chat.warnings[who].map(w => w.id)) + 1 : 1;
                
                // .unshift() coloca la advertencia más reciente al inicio de la lista
                chat.warnings[who].unshift({
                    id: nextId,
                    reason: reason,
                    date: getFormattedDate()
                });

                const currentWarns = chat.warnings[who];
                
                let visualAdd = `⛊ Se ha añadido una advertencia a @${who.split('@')[0]}.\n`;
                visualAdd += `✿ *Advertencias totales (${currentWarns.length}):*\n\n`;
                
                currentWarns.forEach(w => {
                    visualAdd += `#${w.id} » ${w.reason}\n`;
                    visualAdd += `| » Fecha: ${w.date}\n`;
                });

                await client.sendMessage(m.chat, { text: visualAdd.trim(), mentions: [who] }, { quoted: m });

                // Lógica de auto-expulsión (Kick)
                if (chat.warnLimit > 0 && currentWarns.length >= chat.warnLimit) {
                    if (!isBotAdmin) {
                        return m.reply('⚠️ El usuario alcanzó el límite de advertencias, pero no puedo eliminarlo porque *el bot no es administrador*.');
                    }
                    await m.reply(`🚨 @${who.split('@')[0]} ha superado el límite de advertencias (${chat.warnLimit}) y será eliminado.`, null, { mentions: [who] });
                    await client.groupParticipantsUpdate(m.chat, [who], 'remove');
                    // Reiniciar advertencias una vez expulsado (opcional, pero buena práctica)
                    chat.warnings[who] = []; 
                }
                return;

            case 'delwarn':
                if (!isAdmin) return m.reply('🚫 *Comando exclusivo para administradores del grupo.*');
                if (!who) return m.reply('《✧》 Debes mencionar o responder al usuario cuya advertencia deseas eliminar.');

                // Extraer el número de ID que el administrador escribió
                const textWithoutMention = text.replace(/@\d+/g, '').trim();
                const warnId = parseInt(textWithoutMention.split(' ')[0]);

                if (isNaN(warnId)) {
                    return m.reply(`《✧》 Debes especificar el número (#ID) de la advertencia.\nEjemplo: *${prefix}delwarn @usuario 1*`);
                }

                if (!chat.warnings[who] || chat.warnings[who].length === 0) {
                    return m.reply(`El usuario @${who.split('@')[0]} no tiene advertencias para borrar.`, null, { mentions: [who] });
                }

                const warnIndex = chat.warnings[who].findIndex(w => w.id === warnId);
                if (warnIndex === -1) {
                    return m.reply(`❌ No se encontró ninguna advertencia con el ID #${warnId}. Verifica usando ${prefix}warns.`);
                }

                // Borrar la advertencia específica
                chat.warnings[who].splice(warnIndex, 1);
                
                // Intento seguro de obtener el nombre del usuario desde la DB, si no existe usa su número
                const userName = db.users[who]?.name || who.split('@')[0];

                return m.reply(`❀ Se ha eliminado la advertencia #${warnId} del usuario @${who.split('@')[0]} (${userName}).`, null, { mentions: [who] });

            case 'resetwarn':
                if (!isAdmin) return m.reply('🚫 *Comando exclusivo para administradores del grupo.*');
                if (!who) return m.reply('《✧》 Menciona o responde a un usuario válido para restablecer sus advertencias.');

                chat.warnings[who] = []; 
                return m.reply(`⛊ Se han eliminado todas las advertencias del usuario @${who.split('@')[0]}.`, null, { mentions: [who] });
        }
    }
          }
                    
