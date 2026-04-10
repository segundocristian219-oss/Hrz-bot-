const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos'],
    category: 'group',

    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command, isBotAdmin, isAdmin }) => {
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const now = Date.now();
        const twoDays = 2 * 24 * 60 * 60 * 1000;

        let users = [];
        for (let p of participants) {
            if (p.id === botJid) continue;
            const lastSeen = global.actividadGrupo[m.chat][p.id] || 0;
            users.push({
                id: p.id,
                admin: p.admin,
                time: lastSeen,
                isInactive: lastSeen === 0 || (now - lastSeen) >= twoDays
            });
        }

        users.sort((a, b) => a.time - b.time);

        if (command === 'inactivos') {
            const inactivosOnly = users.filter(u => u.isInactive);
            
            let txt = "『 MONITOR DE INACTIVIDAD 』\n\n";
            txt += `✦ Limite: 48 Horas\n`;
            txt += `✦ Total: ${inactivosOnly.length} miembros\n`;
            txt += `──────────────────\n\n`;
            
            if (inactivosOnly.length === 0) {
                txt += "◈ No se detectaron usuarios inactivos.\n";
            } else {
                for (let i = 0; i < inactivosOnly.length; i++) {
                    const u = inactivosOnly[i];
                    let dateStr;
                    
                    if (u.time > 0) {
                        const d = new Date(u.time);
                        const iso = d.toISOString();
                        const datePart = iso.substring(0, 10);
                        const timePart = iso.substring(11, 16);
                        dateStr = `${datePart} | ${timePart} UTC`;
                    } else {
                        dateStr = "Sin actividad reciente";
                    }

                    const num = u.id.split('@')[0];
                    let name = await conn.getName(u.id);
                    if (!name || name === num) name = "User";
                    
                    txt += `[ ${i + 1} ] ── ${name.toUpperCase().substring(0, 20)}\n`;
                    txt += `◈ Numero: +${num}\n`;
                    txt += `◈ Visto: ${dateStr}\n`;
                    txt += `──────────────────\n\n`;
                }
            }

            return conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
        }

        if (command === 'kickinactivos') {
            if (!isAdmin) return m.reply("⨯ Acceso restringido: Administradores.");
            if (!isBotAdmin) return m.reply("⨯ Error: Bot sin privilegios.");

            const option = args[0] ? args[0].toLowerCase() : '';

            if (!['all', 'first50', 'last50'].includes(option)) {
                let menu = "『 GESTION DE LIMPIEZA 』\n\n";
                menu += `◈ Comando: ${usedPrefix + command} [opcion]\n\n`;
                menu += `◈ Opciones disponibles:\n`;
                menu += `➭ all : Purga total de inactivos\n`;
                menu += `➭ first50 : Purga de los 50 mas antiguos\n`;
                menu += `➭ last50 : Purga de los 50 mas recientes\n\n`;
                menu += `✦ Nota: Solo afecta a usuarios con +2 dias de inactividad.\n`;
                menu += `✦ Exencion: Administradores no seran expulsados.`;
                
                return conn.sendMessage(m.chat, { text: menu }, { quoted: m });
            }

            let targets = users.filter(u => u.isInactive && !u.admin);

            if (option === 'first50') targets = targets.slice(0, 50);
            if (option === 'last50') targets = targets.slice(-50);

            if (targets.length === 0) return m.reply("⨯ No hay objetivos detectados.");

            await conn.sendMessage(m.chat, { 
                text: `『 EJECUTANDO PURGA 』\n\nObjetivos: ${targets.length}\nIntervalo: 2s (Seguridad Anti-Lag)` 
            }, { quoted: m });

            for (let u of targets) {
                await delay(2000);
                await conn.groupParticipantsUpdate(m.chat, [u.id], "remove").catch(() => {});
            }

            return conn.sendMessage(m.chat, { text: `『 PROCESO FINALIZADO 』` }, { quoted: m });
        }
    }
};

export default inactivosCommand;
                    
