const warnCommand = {
    name: 'warn',
    alias: ['advertir', 'delwarn', 'quitarwarn', 'warnlist', 'advertencias', 'warnlimit'],
    category: 'group',
    group: true,
    run: async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin, chat }) => {
        try {
            if (!chat.warnLimit) chat.warnLimit = 3;
            let limit = chat.warnLimit;

            if (command === 'warnlimit') {
                if (!isAdmin) {
                    global.dfail('admin', m, conn);
                    return;
                }
                let newLimit = parseInt(text.trim());
                if (isNaN(newLimit) || newLimit < 1 || newLimit > 10) {
                    return conn.reply(m.chat, `*─── [ ⚙ CONFIG ] ───*\n\n*Límite actual:* ${limit}\n\n> *♛ USO CORRECTO*\n*${usedPrefix + command}* [1-10]\n\n_Establece el tope de advertencias para este grupo._`, m);
                }
                chat.warnLimit = newLimit;
                return conn.reply(m.chat, `*─── [ ♛ AJUSTE ] ───*\n\n*Nuevo límite establecido en:* ${newLimit}\n\n_Los usuarios serán expulsados al llegar a ${newLimit} advertencias._`, m);
            }

            let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
            let warnDoc = who ? await global.Warns.findOne({ userId: who, groupId: m.chat }) : null;

            if (['warnlist', 'advertencias'].includes(command)) {
                if (who) {
                    if (!warnDoc || warnDoc.warnCount === 0) {
                        return conn.reply(m.chat, `*─── [ ⚖ REGISTRO ] ───*\n\n_El usuario @${who.split`@`[0]} no tiene advertencias._`, m, { mentions: [who] });
                    }

                    let detail = `*─── [ ⚖ EXPEDIENTE ] ───*\n\n`;
                    detail += `*✰ Usuario:* @${who.split`@`[0]}\n`;
                    detail += `*❑ Estado:* ${warnDoc.warnCount}/${limit}\n\n`;
                    detail += `*◈ HISTORIAL:* \n`;
                    warnDoc.reasons.forEach((reason, i) => {
                        detail += `\n*${i + 1}.* ${reason}`;
                    });
                    detail += `\n\n*⍰ Nota:* _Al llegar a ${limit} será expulsado._`;
                    return conn.reply(m.chat, detail, m, { mentions: [who] });
                }

                let allWarns = await global.Warns.find({ groupId: m.chat });
                if (allWarns.length === 0) return conn.reply(m.chat, `*─── [ ⍰ ESTADO ] ───*\n\n_No hay usuarios advertidos en este grupo._`, m);

                let list = `*─── [ ⍰ USUARIOS ADVERTIDOS ] ───*\n\n`;
                allWarns.forEach((w, i) => {
                    list += `*${i + 1}.* @${w.userId.split('@')[0]} ( ${w.warnCount}/${limit} )\n`;
                });
                list += `\n_Usa *${usedPrefix + command} @user* para ver detalles._`;
                return conn.reply(m.chat, list, m, { mentions: allWarns.map(w => w.userId) });
            }

            if (!isAdmin) {
                global.dfail('admin', m, conn);
                return;
            }

            if (!who) return conn.reply(m.chat, `> *♛ USO CORRECTO*\n\nEtiqueta o responde a alguien:\n*${usedPrefix + command}* @user [motivo]`, m);

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

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
                let reasonWithMeta = `${reasonRaw} ( ${date} | ${time} )`;

                warnDoc.warnCount += 1;
                warnDoc.reasons.push(reasonWithMeta); 
                await warnDoc.save();

                if (warnDoc.warnCount < limit) {
                    let txt = `*─── [ ▶ ADVERTENCIA ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Advertencias:* ${warnDoc.warnCount}/${limit}\n`;
                    txt += `*⍰ Motivo:* ${reasonRaw}\n`;
                    txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                    txt += `_Al llegar a ${limit} advertencias serás expulsado._`;
                    await conn.reply(m.chat, txt, m, { mentions: [who] });
                } else {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    let txt = `*─── [ ×᷼× EXPULSADO ] ───*\n\n`;
                    txt += `*♛ Usuario:* @${who.split`@`[0]}\n`;
                    txt += `*✰ Motivo final:* ${reasonRaw}\n\n`;
                    txt += `_Superó el límite de ${limit} y el registro fue purgado._`;
                    await conn.reply(m.chat, txt, m, { mentions: [who] });
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
                }
            }

            else if (['delwarn', 'quitarwarn'].includes(command)) {
                if (!warnDoc || warnDoc.warnCount === 0) {
                    return conn.reply(m.chat, `*─── [ ♛ INFO ] ───*\n\nEl usuario @${who.split`@`[0]} no tiene advertencias.`, m, { mentions: [who] });
                }

                let arg = text.replace(/@(\d+)/g, '').trim().toLowerCase();

                if (arg === 'all' || arg === 'todos') {
                    await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    return conn.reply(m.chat, `*─── [ ♛ INFO ] ───*\n\n*Se han borrado TODAS las advertencias de:* @${who.split`@`[0]}`, m, { mentions: [who] });
                }

                let num = parseInt(arg);
                if (!isNaN(num)) {
                    if (num > 0 && num <= warnDoc.warnCount) {
                        warnDoc.reasons.splice(num - 1, 1);
                        warnDoc.warnCount -= 1;
                        if (warnDoc.warnCount === 0) await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                        else await warnDoc.save();
                        return conn.reply(m.chat, `*─── [ ♛ INFO ] ───*\n\n*Advertencia #${num} removida.*\n*Estado:* ${warnDoc.warnCount}/${limit}`, m, { mentions: [who] });
                    } else {
                        return conn.reply(m.chat, `*⍰ Número fuera de rango.*`, m);
                    }
                } else {
                    warnDoc.warnCount -= 1;
                    warnDoc.reasons.pop();
                    if (warnDoc.warnCount === 0) await global.Warns.deleteOne({ userId: who, groupId: m.chat });
                    else await warnDoc.save();
                    return conn.reply(m.chat, `*─── [ ♛ INFO ] ───*\n\n*Última advertencia removida.*\n*Estado:* ${warnDoc.warnCount}/${limit}`, m, { mentions: [who] });
                }
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default warnCommand;
