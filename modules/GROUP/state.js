import fs from 'fs';
import path from 'path';

export const actividadCommand = {
    category: 'group',
    commands: {
        actividad_stats: {
            name: 'actividad_stats',
            alias: ['activos', 'fantasmas', 'inactivos'],
            group: true,
            admin: true,
            run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const participants = groupMetadata?.participants || [];
                    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                    const jsonPath = path.resolve('./database/actividad.json');
                    let dbActividad = {};

                    if (fs.existsSync(jsonPath)) {
                        try {
                            dbActividad = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                        } catch (err) {
                            console.error(err);
                        }
                    }

                    const groupActivity = dbActividad[m.chat] || {};

                    let data = participants.map(p => {
                        const mensajesUsuario = groupActivity[p.id] || 0;
                        return {
                            id: p.id,
                            admin: p.admin,
                            mensajes: mensajesUsuario
                        };
                    });

                    if (command === 'activos') {
                        let usuariosActivos = data.filter(u => u.mensajes > 0 && u.id !== botJid);

                        if (usuariosActivos.length === 0) {
                            return conn.reply(m.chat, '> ┃ ✎ ɪɴғᴏ: Aun no hay registros de actividad en la base de datos de este grupo.', m);
                        }

                        usuariosActivos.sort((a, b) => b.mensajes - a.mensajes);

                        let txt = `*── 「 TOP USUARIOS MÁS ACTIVOS 」 ──*\n\n`;
                        txt += `Miembros activos: ${usuariosActivos.length}\n\n`;

                        const topMiembros = usuariosActivos.slice(0, 150);
                        topMiembros.forEach((u, i) => {
                            txt += `${i + 1}. @${u.id.split('@')[0]} ── *${u.mensajes}* mensajes\n`;
                        });


                        return conn.sendMessage(m.chat, { text: txt, mentions: topMiembros.map(u => u.id) }, { quoted: m });
                    }

                    if (['fantasmas', 'inactivos'].includes(command)) {
                        const fantasmas = data.filter(u => u.mensajes === 0 && u.id !== botJid);

                        if (fantasmas.length === 0) {
                            return conn.reply(m.chat, '> ┃ ✎ ɪɴғᴏ: No hay usuarios inactivos detectados en este grupo.', m);
                        }

                        if (args[0] === 'kick' || args[0] === 'eliminar') {
                            if (!isAdmin) return global.dfail('admin', m, conn);
                            if (!isBotAdmin) return global.dfail('botAdmin', m, conn);

                            await conn.reply(m.chat, `Procediendo a eliminar a *${fantasmas.length}* miembros inactivos...`, m);

                            for (let fantasma of fantasmas) {
                                await conn.groupParticipantsUpdate(m.chat, [fantasma.id], 'remove');
                                await new Promise(r => setTimeout(r, 1500)); 
                            }
                            return conn.reply(m.chat, 'Limpieza de inactivos completada con éxito.', m);
                        }

                        let txt = `*── 「 LISTA DE INACTIVOS 」 ──*\n\n`;
                        txt += `Total detectados: ${fantasmas.length}\n`;
                        txt += `Para eliminarlos usa: *${usedPrefix + command} kick*\n\n`;

                        fantasmas.forEach((u, i) => {
                            txt += `${i + 1}. @${u.id.split('@')[0]}\n`;
                        });


                        return conn.sendMessage(m.chat, { text: txt, mentions: fantasmas.map(u => u.id) }, { quoted: m });
                    }

                } catch (e) {
                    console.error(e);
                    conn.reply(m.chat, '❌ Ocurrió un error interno.', m);
                }
            }
        }
    }
};
