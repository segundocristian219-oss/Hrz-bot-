const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos', 'warninactivos'],
    category: 'group',

    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
        if (!m.isGroup || !isAdmin) return;

        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const now = Date.now();
        const limite = 60 * 1000; 

        let inactivos = [];
        let fantasmas = [];
        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);

        for (let p of participants) {
            if (p.id === botJid || groupAdmins.includes(p.id)) continue;
            
            const lastSeen = global.actividadGrupo[m.chat][p.id] || 0;
            let name = await conn.getName(p.id);
            
            if (!name || name.includes('@')) name = "Usuario Sin Nombre";

            if (lastSeen === 0) {
                fantasmas.push({ id: p.id, name });
            } else if ((now - lastSeen) >= limite) {
                inactivos.push({ id: p.id, name });
            }
        }

        if (command === 'inactivos') {
            let txt = "『 REPORTE DE ACTIVIDAD 』\n\n";
            
            if (inactivos.length > 0) {
                txt += `◈ INACTIVOS (+1m):\n`;
                for (let u of inactivos) txt += `• ${u.name}\n`;
                txt += `\n`;
            }

            if (fantasmas.length > 0) {
                txt += `◈ FANTASMAS:\n`;
                for (let f of fantasmas) txt += `• ${f.name}\n`;
                txt += `\n`;
            }

            if (inactivos.length === 0 && fantasmas.length === 0) {
                txt += "◈ No se detectaron usuarios inactivos.\n";
            }

            txt += `──────────────────\n`;
            txt += `> Usa ${usedPrefix}kickinactivos para abrir el menu de gestion`;
            
            return conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
        }

        if (command === 'warninactivos') {
            const targets = [...inactivos, ...fantasmas];
            if (targets.length === 0) return m.reply("⨯ No hay usuarios para advertir.");

            let warnTxt = "『 AVISO DE ACTIVIDAD 』\n\n";
            warnTxt += "Los siguientes usuarios deben reportarse pronto:\n\n";
            for (let u of targets) warnTxt += `• ${u.name}\n`;
            
            return conn.sendMessage(m.chat, { text: warnTxt }, { quoted: m });
        }

        if (command === 'kickinactivos') {
            if (!isBotAdmin) return m.reply("⨯ Necesito ser Admin.");
            const opt = args[0]?.toLowerCase();

            if (!['all', 'inactivos', 'fantasmas'].includes(opt)) {
                let menu = "『 MENU DE GESTION 』\n\n";
                menu += `➭ ${usedPrefix + command} all\n`;
                menu += `➭ ${usedPrefix + command} inactivos\n`;
                menu += `➭ ${usedPrefix + command} fantasmas\n\n`;
                menu += `✦ Total objetivos: ${inactivos.length + fantasmas.length}`;
                return m.reply(menu);
            }

            let toKick = opt === 'inactivos' ? inactivos : (opt === 'fantasmas' ? fantasmas : [...inactivos, ...fantasmas]);
            if (toKick.length === 0) return m.reply("⨯ Nada que gestionar aqui.");

            m.reply(`『 PROCESANDO ${toKick.length} MIEMBROS 』`);
            for (let u of toKick) {
                await delay(2000);
                await conn.groupParticipantsUpdate(m.chat, [u.id], "remove").catch(() => {});
            }
            return m.reply("『 GESTION FINALIZADA 』");
        }
    }
};

export default inactivosCommand;
