const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos', 'warninactivos', 'fantasmas', 'limpieza'],
    category: 'group',

    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
        if (!m.isGroup) return m.reply("⨯ El radar solo funciona en grupos.");
        if (!isAdmin) return m.reply("⨯ Solo los administradores tienen acceso al radar.");

        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const now = Date.now();
        const limite = 60 * 1000; 

        let inactivos = [];
        let fantasmas = [];
        let inactivosJid = [];
        let fantasmasJid = [];

        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);

        for (let p of participants) {
            if (p.id === botJid || groupAdmins.includes(p.id)) continue;
            
            const lastSeen = global.actividadGrupo[m.chat][p.id] || 0;
            const formatMention = `@${p.id.split('@')[0]}`;
            
            if (lastSeen === 0) {
                fantasmas.push(`👻 ${formatMention}`);
                fantasmasJid.push(p.id);
            } else if ((now - lastSeen) >= limite) {
                inactivos.push(`💤 ${formatMention}`);
                inactivosJid.push(p.id);
            }
        }

        const total = inactivos.length + fantasmas.length;

        if (command === 'inactivos' || command === 'fantasmas') {
            let txt = "『 📡 RADAR DE ACTIVIDAD 📡 』\n\n";
            
            if (total === 0) {
                return m.reply("『 ✨ GRUPO IMPECABLE ✨ 』\n\nTodos los miembros están activos y reportándose.");
            }

            if (inactivos.length > 0) {
                txt += `◈ EN SUEÑO PROFUNDO:\n${inactivos.join('\n')}\n\n`;
            }

            if (fantasmas.length > 0) {
                txt += `◈ FANTASMAS (Cero actividad):\n${fantasmas.join('\n')}\n\n`;
            }

            txt += `──────────────────\n`;
            txt += `📊 Total detectados: ${total}\n\n`;
            txt += `> ➭ ${usedPrefix}warninactivos (Avisar)\n`;
            txt += `> ➭ ${usedPrefix}kickinactivos (Purgar)`;
            
            return conn.sendMessage(m.chat, { text: txt.trim(), mentions: [...inactivosJid, ...fantasmasJid] }, { quoted: m });
        }

        if (command === 'warninactivos') {
            const targets = [...inactivosJid, ...fantasmasJid];
            if (targets.length === 0) return m.reply("⨯ El radar está limpio. No hay a quién advertir.");

            let warnTxt = "『 ⚠️ ALERTA DE PURGA ⚠️ 』\n\n";
            warnTxt += "El radar ha detectado inactividad crítica. Repórtense inmediatamente o serán eliminados en la próxima limpieza:\n\n";
            
            const allTags = [...inactivos, ...fantasmas];
            warnTxt += allTags.join('\n');
            warnTxt += `\n\n> ⏳ El tiempo corre...`;
            
            return conn.sendMessage(m.chat, { text: warnTxt, mentions: targets }, { quoted: m });
        }

        if (command === 'kickinactivos' || command === 'limpieza') {
            if (!isBotAdmin) return m.reply("⨯ Necesito ser administrador en el grupo para iniciar la purga.");
            
            const opt = args[0]?.toLowerCase();

            if (!['all', 'inactivos', 'fantasmas'].includes(opt)) {
                let menu = "『 ☠️ PANEL DE PURGA ☠️ 』\n\n";
                menu += `Selecciona el objetivo de la limpieza:\n\n`;
                menu += `➭ *${usedPrefix + command} fantasmas*\n`;
                menu += `➭ *${usedPrefix + command} inactivos*\n`;
                menu += `➭ *${usedPrefix + command} all* (Purga total)\n\n`;
                menu += `📊 Objetivos en la mira: ${total}`;
                return m.reply(menu);
            }

            let toKick = opt === 'inactivos' ? inactivosJid : (opt === 'fantasmas' ? fantasmasJid : [...inactivosJid, ...fantasmasJid]);
            
            if (toKick.length === 0) return m.reply(`⨯ No hay ${opt} en el radar para purgar.`);

            await conn.sendMessage(m.chat, { text: `『 🔥 INICIANDO PURGA 🔥 』\n\nEjecutando orden de expulsión para ${toKick.length} usuarios. No hay marcha atrás...` }, { quoted: m });
            
            let eliminados = 0;
            for (let jid of toKick) {
                await delay(1500);
                try {
                    await conn.groupParticipantsUpdate(m.chat, [jid], "remove");
                    eliminados++;
                } catch (e) {}
            }
            
            return conn.sendMessage(m.chat, { text: `『 ✔️ PURGA FINALIZADA 』\n\n☠️ Usuarios eliminados: ${eliminados}\n✨ El grupo ha sido limpiado exitosamente.` }, { quoted: m });
        }
    }
};

export default inactivosCommand;
                
