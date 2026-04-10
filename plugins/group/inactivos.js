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

        let users = [];
        for (let p of participants) {
            if (p.id === botJid) continue;
            users.push({
                id: p.id,
                admin: p.admin,
                time: global.actividadGrupo[m.chat][p.id] || 0
            });
        }

        users.sort((a, b) => a.time - b.time);

        if (command === 'inactivos') {
            let txt = "≡ REGISTRO DE INACTIVIDAD ≡\n\n";
            
            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                let dateStr = "Sin registro desde el inicio";
                
                if (u.time > 0) {
                    const d = new Date(u.time);
                    const iso = d.toISOString();
                    const datePart = iso.substring(0, 10);
                    const timePart = iso.substring(11, 16);
                    dateStr = `${datePart} a las ${timePart} UTC`;
                }

                const num = u.id.split('@')[0];
                let name = await conn.getName(u.id);
                if (!name) name = `Usuario ${i + 1}`;
                
                txt += `${i + 1}. ${name}\n`;
                txt += `+${num}\n`;
                txt += `[ ${dateStr} ]\n\n`;
            }

            return conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
        }

        if (command === 'kickinactivos') {
            if (!isAdmin) return m.reply("⨯ Permisos de administrador requeridos.");
            if (!isBotAdmin) return m.reply("⨯ El bot requiere ser administrador.");

            const option = args[0] ? args[0].toLowerCase() : '';

            if (!['all', 'first50', 'last50'].includes(option)) {
                let menu = "≡ PANEL DE EXPULSION ≡\n\n";
                menu += `Uso: ${usedPrefix + command} [opcion]\n\n`;
                menu += `Opciones:\n`;
                menu += `- all : Expulsa a todos los inactivos\n`;
                menu += `- first50 : Expulsa a los 50 mas inactivos\n`;
                menu += `- last50 : Expulsa a los 50 menos inactivos\n\n`;
                menu += `* Los administradores son omitidos automaticamente.`;
                
                return conn.sendMessage(m.chat, { text: menu }, { quoted: m });
            }

            let targets = users.filter(u => !u.admin);

            if (option === 'first50') targets = targets.slice(0, 50);
            if (option === 'last50') targets = targets.slice(-50);

            if (targets.length === 0) return m.reply("⨯ No hay miembros elegibles para expulsar.");

            await conn.sendMessage(m.chat, { 
                text: `≡ INICIANDO LIMPIEZA ≡\n\nProcesando ${targets.length} miembros.\nSe aplicara un retraso de 2 segundos por usuario para evitar caidas de latencia...` 
            }, { quoted: m });

            for (let u of targets) {
                await delay(2000);
                await conn.groupParticipantsUpdate(m.chat, [u.id], "remove").catch(() => {});
            }

            return conn.sendMessage(m.chat, { text: `≡ LIMPIEZA FINALIZADA ≡` }, { quoted: m });
        }
    }
};

export default inactivosCommand;
