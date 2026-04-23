import { jidNormalizedUser } from '@whiskeysockets/baileys';

const activityTracker = {
    name: 'activos',
    alias: ['fantasmas', 'inactivos'],
    category: 'grupo',
    run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin, participants, isOwner }) => {
        try {
            /* if (!isOwner) return m.reply('『 ❗ 』 Este comando es de uso exclusivo para el Creador del Bot.');
            */

            if (!m.isGroup) return m.reply('『 ❗ 』 Este comando es exclusivo para grupos.');

            const botJid = jidNormalizedUser(conn.user.id);
            const userIds = participants.map(p => jidNormalizedUser(p.id));

            const usersData = await global.User.find({ id: { $in: userIds } });
            const dataMap = new Map(usersData.map(u => [u.id, u]));

            let data = participants.map(p => {
                const userJid = jidNormalizedUser(p.id);
                const userDb = dataMap.get(userJid) || {};
                return {
                    id: userJid,
                    admin: !!(p.admin || p.isCommunityAdmin),
                    mensajes: userDb.exp || 0 
                };
            });

            if (command === 'activos') {
                let usuariosActivos = data.filter(u => u.mensajes > 0);

                if (usuariosActivos.length === 0) {
                    return m.reply('『 📊 』 Aún no hay registro de actividad en este grupo.');
                }

                usuariosActivos.sort((a, b) => b.mensajes - a.mensajes);

                let txt = `『 📊 RANKING DE ACTIVIDAD 』\n\n`;
                usuariosActivos.slice(0, 50).forEach((u, i) => {
                    txt += `${i + 1}. @${u.id.split('@')[0]} › *${u.mensajes}* pts\n`;
                });

                return conn.sendMessage(m.chat, { 
                    text: txt, 
                    mentions: usuariosActivos.slice(0, 50).map(u => u.id),
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }

            if (command === 'fantasmas' || command === 'inactivos') {
                const fantasmas = data.filter(u => u.mensajes === 0 && !u.admin && u.id !== botJid);

                if (fantasmas.length === 0) {
                    return m.reply('『 👻 』 ¡No hay fantasmas aquí! Todos han participado.');
                }

                if (args[0] === 'kick' || args[0] === 'eliminar') {
                    if (!isAdmin) return m.reply('『 ❌ 』 Solo los administradores pueden eliminar fantasmas.');
                    if (!isBotAdmin) return m.reply('『 ❌ 』 Necesito ser administrador para eliminarlos.');

                    await m.reply(`『 ☠️ 』 Eliminando *${fantasmas.length}* miembros inactivos...`);

                    for (let fantasma of fantasmas) {
                        await conn.groupParticipantsUpdate(m.chat, [fantasma.id], "remove");
                        await new Promise(r => setTimeout(r, 1500)); 
                    }
                    return m.reply('『 ✅ 』 Limpieza completada.');
                }

                let txt = `『 👻 LISTA DE INACTIVOS 』\n\n`;
                txt += `◈ *Total:* ${fantasmas.length}\n`;
                txt += `> Para eliminarlos usa: *${usedPrefix + command} kick*\n\n`;

                fantasmas.forEach((u, i) => {
                    txt += `${i + 1}. @${u.id.split('@')[0]}\n`;
                });

                return conn.sendMessage(m.chat, { 
                    text: txt, 
                    mentions: fantasmas.map(u => u.id),
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }
        } catch (e) {
            console.error("Error en tracker:", e);
            m.reply("『 ❗ 』 Error al procesar la lista.");
        }
    }
};

export default activityTracker;
