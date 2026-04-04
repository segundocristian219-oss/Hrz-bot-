const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warns', 'advertencias'],
    category: 'group',
    group: true,
    run: async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {
        try {
            // 1. VER ADVERTENCIAS GLOBALES DEL GRUPO (.warns)
            if (['warns', 'advertencias'].includes(command)) {
                let allWarns = await global.Warns.find({ groupId: m.chat });
                if (allWarns.length === 0) return conn.reply(m.chat, `*─── [ ⍰ ESTADO ] ───*\n\n_No hay usuarios advertidos en este grupo._`, m);
                
                let list = `*─── [ ⍰ USUARIOS ADVERTIDOS ] ───*\n\n`;
                allWarns.forEach((w, i) => {
                    list += `*${i + 1}.* @${w.userId.split('@')[0]}\n`;
                    list += `*⌬ Warns:* ${w.warnCount}/3\n`;
                    list += `*᳀ Motivos:* \n  - ${w.reasons.join('\n  - ') || 'Sin especificar'}\n\n`;
                });
                return conn.reply(m.chat, list, m, { mentions: allWarns.map(w => w.userId) });
            }

            // 2. VERIFICAR PERMISOS DE ADMIN
            if (!isAdmin) {
                global.dfail('admin', m, conn);
                return;
            }

            // 3. IDENTIFICAR AL USUARIO
            let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
            if (!who) return conn.reply(m.chat, `> *♛ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo / número / all]`, m);

            // Buscar si ya tiene un registro en la base de datos
            let warnDoc = await global.Warns.findOne({ userId: who, groupId: m.chat });
            
            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            // 4. LÓGICA: DAR ADVERTENCIA (.warn / .advertir)
            // Usamos .includes para evitar que coincida con "delwarn"
            if (['warn', 'advertir'].includes(command)) {
                if (!isBotAdmin) {
                    global.dfail('botAdmin', m, conn);
                    return;
                }
                
                if (!warnDoc) {
                    warnDoc = new global.Warns({ userId: who, groupId: m.chat, warnCount: 0, reasons: [] });
                }

                let reason = text ? text.replace(/@(\d+)/g, '').trim() : 'Sin motivo';
                if (reason === '') reason = 'Sin motivo';

                warnDoc.warnCount += 1;
                warnDoc.reasons.push(reason); 
                await warnDoc.save();

                if (warnDoc.warnCount < 3) {
                    let txt = `*─── [ ▶ ADVERTENCIA ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Advertencias:* ${warnDoc.warnCount}/3\n`;
                    txt += `*⍰ Motivos acumulados:* \n- ${warnDoc.reasons.join('\n- ')}\n`;
                    txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                    txt += `_Al llegar a 3 advertencias serás expulsado._`;
                    await conn.reply(m.chat, txt, m, { mentions: [who] });
                } else {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    let txt = `*─── [ ×᷼× EXPULSADO ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Motivo final:* ${reason}\n\n`;
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
                        
                        return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n*Advertencia #${num} removida:*\n- ${removedReason}\n\n*Estado actual:* ${warnDoc.warnCount}/3`, m, { mentions: [who] });
                    } else {
                        return conn.reply(m.chat, `*❌ Número inválido.*\nEl usuario tiene ${warnDoc.warnCount} advertencias.\nPara borrar una, usa un número del 1 al ${warnDoc.warnCount}.\nEjemplo: *${usedPrefix + command} @user 1*`, m);
                    }
                } else {
                    warnDoc.warnCount -= 1;
                    let removedReason = warnDoc.reasons.pop();
                    
                    if (warnDoc.warnCount === 0) {
                        await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    } else {
                        await warnDoc.save();
                    }
                    return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n*Última advertencia removida.*\n- ${removedReason}\n\n*Estado actual:* ${warnDoc.warnCount}/3\n\n_Tip: Puedes usar *${usedPrefix + command} @user all* para borrar todas._`, m, { mentions: [who] });
                }
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default warnCommand;
