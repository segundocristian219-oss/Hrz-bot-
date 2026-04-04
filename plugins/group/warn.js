const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warnlist', 'advertencias'],
    category: 'group',
    group: true,
    run: async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {
        try {
            // 1. IDENTIFICAR AL USUARIO (Para consultas o acciones)
            let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
            let warnDoc = who ? await global.Warns.findOne({ userId: who, groupId: m.chat }) : null;

            // 2. LÓGICA: CONSULTAR LISTA (.warnlist / .advertencias)
            if (['warnlist', 'advertencias'].includes(command)) {
                // CASO A: CONSULTA ESPECÍFICA (Mencionó a alguien)
                if (who) {
                    if (!warnDoc || warnDoc.warnCount === 0) {
                        return conn.reply(m.chat, `*─── [ ⚖ REGISTRO ] ───*\n\n_El usuario @${who.split`@`[0]} está limpio. No tiene advertencias._`, m, { mentions: [who] });
                    }

                    let detail = `*─── [ ⚖ EXPEDIENTE DE USUARIO ] ───*\n\n`;
                    detail += `*👤 Usuario:* @${who.split`@`[0]}\n`;
                    detail += `*🛡 Estado:* ${warnDoc.warnCount}/3 Advertencias\n\n`;
                    detail += `*◈ HISTORIAL DETALLADO:* \n`;
                    
                    warnDoc.reasons.forEach((reason, i) => {
                        detail += `\n*${i + 1}.* ${reason}`;
                    });

                    detail += `\n\n*⚠️ Nota:* _Si el usuario llega a 3 advertencias, el sistema procederá con la expulsión automática._`;
                    return conn.reply(m.chat, detail, m, { mentions: [who] });
                }

                // CASO B: CONSULTA GENERAL (No mencionó a nadie)
                let allWarns = await global.Warns.find({ groupId: m.chat });
                if (allWarns.length === 0) return conn.reply(m.chat, `*─── [ ⍰ ESTADO ] ───*\n\n_No hay usuarios advertidos en este grupo._`, m);
                
                let list = `*─── [ ⍰ USUARIOS ADVERTIDOS ] ───*\n\n`;
                allWarns.forEach((w, i) => {
                    list += `*${i + 1}.* @${w.userId.split('@')[0]} ( ${w.warnCount}/3 )\n`;
                });
                list += `\n_Usa *${usedPrefix + command} @user* para ver los motivos detallados._`;
                return conn.reply(m.chat, list, m, { mentions: allWarns.map(w => w.userId) });
            }

            // 3. VERIFICAR PERMISOS DE ADMIN (Solo para dar/quitar)
            if (!isAdmin) {
                global.dfail('admin', m, conn);
                return;
            }

            // Para los comandos de acción, necesitamos un usuario sí o sí
            if (!who) return conn.reply(m.chat, `> *♛ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo / número / all]`, m);

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            // 4. LÓGICA: DAR ADVERTENCIA (.warn / .advertir)
            if (['warn', 'advertir'].includes(command)) {
                if (!isBotAdmin) {
                    global.dfail('botAdmin', m, conn);
                    return;
                }
                
                if (!warnDoc) {
                    warnDoc = new global.Warns({ userId: who, groupId: m.chat, warnCount: 0, reasons: [] });
                }

                let reasonRaw = text ? text.replace(/@(\d+)/g, '').trim() : 'Sin motivo';
                if (reasonRaw === '') reasonRaw = 'Sin motivo';
                
                // Formateamos el motivo para incluir fecha y hora internamente
                let reasonWithMeta = `${reasonRaw} \n      *└ 📅 Fecha:* _${date}_ | *🕒 Hora:* _${time}_`;

                warnDoc.warnCount += 1;
                warnDoc.reasons.push(reasonWithMeta); 
                await warnDoc.save();

                if (warnDoc.warnCount < 3) {
                    let txt = `*─── [ ▶ ADVERTENCIA ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Advertencias:* ${warnDoc.warnCount}/3\n`;
                    txt += `*⍰ Motivo actual:* ${reasonRaw}\n`;
                    txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                    txt += `_Al llegar a 3 advertencias serás expulsado._`;
                    await conn.reply(m.chat, txt, m, { mentions: [who] });
                } else {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    let txt = `*─── [ ×᷼× EXPULSADO ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Motivo final:* ${reasonRaw}\n\n`;
                    txt += `_Superó el límite de 3 advertencias y el registro fue purgado._`;
                    await conn.reply(m.chat, txt, m, { mentions: [who] });
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
                }
            }

            // 5. LÓGICA: QUITAR ADVERTENCIA (.delwarn / .quitarwarn)
            else if (['delwarn', 'quitarwarn'].includes(command)) {
                if (!warnDoc || warnDoc.warnCount === 0) {
                    return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\nEl usuario @${who.split`@`[0]} no tiene advertencias en este grupo.`, m, { mentions: [who] });
                }

                let arg = text.replace(/@(\d+)/g, '').trim().toLowerCase();

                if (arg === 'all' || arg === 'todos') {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n*Se han borrado TODAS las advertencias de:* @${who.split`@`[0]}`, m, { mentions: [who] });
                }

                let num = parseInt(arg);
                if (!isNaN(num)) {
                    if (num > 0 && num <= warnDoc.warnCount) {
                        let removedReason = warnDoc.reasons.splice(num - 1, 1)[0];
                        warnDoc.warnCount -= 1;
                        
                        if (warnDoc.warnCount === 0) {
                            await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                        } else {
                            await warnDoc.save();
                        }
                        
                        return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n*Advertencia #${num} removida.*\n\n*Estado actual:* ${warnDoc.warnCount}/3`, m, { mentions: [who] });
                    } else {
                        return conn.reply(m.chat, `*❌ Número inválido.*\nEl usuario tiene ${warnDoc.warnCount} advertencias.`, m);
                    }
                } else {
                    warnDoc.warnCount -= 1;
                    warnDoc.reasons.pop();
                    
                    if (warnDoc.warnCount === 0) {
                        await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    } else {
                        await warnDoc.save();
                    }
                    return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n*Última advertencia removida.*\n\n*Estado actual:* ${warnDoc.warnCount}/3`, m, { mentions: [who] });
                }
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default warnCommand;
                
