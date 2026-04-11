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
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");
        if (!isAdmin) return m.reply("⨯ Acceso restringido: Solo Administradores.");

        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const now = Date.now();
        const tiempoLimite = 1 * 60 * 1000; 

        let inactivos = [];
        let fantasmas = [];
        
        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);

        for (let p of participants) {
            if (p.id === botJid || groupAdmins.includes(p.id)) continue;

            const lastSeen = global.actividadGrupo[m.chat][p.id] || 0;

            if (lastSeen === 0) {
                fantasmas.push({ id: p.id });
            } else if ((now - lastSeen) >= tiempoLimite) {
                inactivos.push({ id: p.id, time: lastSeen });
            }
        }

        inactivos.sort((a, b) => a.time - b.time);
        const totalObjetivos = inactivos.length + fantasmas.length;

        if (command === 'inactivos') {
            let txt = "『 MONITOR DE ACTIVIDAD 』\n\n";
            txt += `✦ Limite: 1 Minuto\n`;
            txt += `✦ Total Detectados: ${totalObjetivos}\n`;
            txt += `──────────────────\n\n`;

            if (totalObjetivos === 0) {
                txt += "◈ El grupo esta activo.\n";
                return conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
            }

            if (inactivos.length > 0) {
                txt += `[ ⚠️ ] ── INACTIVOS (+1m)\n\n`;
                for (let u of inactivos) {
                    const d = new Date(u.time);
                    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    txt += `◈ @${u.id.split('@')[0]} ➭ Visto: ${timeStr}\n`;
                }
                txt += `\n──────────────────\n\n`;
            }

            if (fantasmas.length > 0) {
                txt += `[ 👻 ] ── FANTASMAS\n\n`;
                for (let f of fantasmas) {
                    txt += `◈ @${f.id.split('@')[0]}\n`;
                }
                txt += `\n──────────────────\n`;
            }

            const allMentions = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];
            return conn.sendMessage(m.chat, { text: txt.trim(), mentions: allMentions }, { quoted: m });
        }

        if (command === 'warninactivos') {
            if (totalObjetivos === 0) return m.reply("⨯ No hay usuarios para advertir.");

            let warnTxt = "『 ⚠️ ADVERTENCIA ⚠️ 』\n\n";
            warnTxt += `Se detecto inactividad. Envien un mensaje para evitar ser eliminados.\n\n`;
            
            const allTargets = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];
            for (let id of allTargets) warnTxt += `◈ @${id.split('@')[0]}\n`;
            
            return conn.sendMessage(m.chat, { text: warnTxt, mentions: allTargets }, { quoted: m });
        }

        if (command === 'kickinactivos') {
            if (!isBotAdmin) return m.reply("⨯ El bot necesita ser admin.");

            const option = args[0]?.toLowerCase();

            if (!['all', 'inactivos', 'fantasmas'].includes(option)) {
                let menu = "『 GESTION DE LIMPIEZA 』\n\n";
                menu += `➭ ${usedPrefix + command} inactivos\n`;
                menu += `➭ ${usedPrefix + command} fantasmas\n`;
                menu += `➭ ${usedPrefix + command} all\n\n`;
                menu += `✦ Objetivos: ${totalObjetivos}`;
                return conn.sendMessage(m.chat, { text: menu }, { quoted: m });
            }

            let targetsToKick = [];
            if (option === 'inactivos') targetsToKick = inactivos.map(u => u.id);
            if (option === 'fantasmas') targetsToKick = fantasmas.map(u => u.id);
            if (option === 'all') targetsToKick = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];

            if (targetsToKick.length === 0) return m.reply("⨯ Sin objetivos.");

            await conn.sendMessage(m.chat, { text: `『 PURGANDO ${targetsToKick.length} MIEMBROS 』` }, { quoted: m });

            for (let id of targetsToKick) {
                await delay(2000);
                await conn.groupParticipantsUpdate(m.chat, [id], "remove").catch(() => {});
            }

            return conn.sendMessage(m.chat, { text: `『 LIMPIEZA COMPLETADA 』` }, { quoted: m });
        }
    }
};

export default inactivosCommand;
