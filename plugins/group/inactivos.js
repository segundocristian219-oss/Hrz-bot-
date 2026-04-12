const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos', 'warninactivos', 'radar'],
    category: 'group',

    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        if (!global.actividadGrupo[m.chat]._startRadar) {
            global.actividadGrupo[m.chat]._startRadar = Date.now();
        }
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
        if (!m.isGroup) return m.reply("⨯ El radar solo funciona en grupos.");
        if (!isAdmin) return m.reply("⨯ Acceso denegado. Solo administradores.");

        global.actividadGrupo = global.actividadGrupo || {};
        const chatActividad = global.actividadGrupo[m.chat] || {};
        const startRadar = chatActividad._startRadar || Date.now();

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const ownerList = (global.config?.owner || []).map(o => o[0] + '@s.whatsapp.net');
        
        const now = Date.now();
        const unDiaYMedio = 1.5 * 24 * 60 * 60 * 1000; 

        const tiempoTranscurrido = now - startRadar;
        if (tiempoTranscurrido < unDiaYMedio && (command === 'kickinactivos' || command === 'warninactivos')) {
            const faltante = unDiaYMedio - tiempoTranscurrido;
            const horas = Math.floor(faltante / (60 * 60 * 1000));
            const mins = Math.floor((faltante % (60 * 60 * 1000)) / (60 * 1000));
            return m.reply(`『 📡 RADAR EN CALIBRACIÓN 📡 』\n\nEl sistema aún no tiene suficiente información para ejecutar acciones.\n\n◈ Tiempo restante para análisis: ${horas}h ${mins}m.\n\n> Evitamos expulsiones injustas esperando a que todos tengan oportunidad de hablar.`);
        }

        let inactivos = [];
        let mencionesJid = [];

        for (let p of participants) {
            if (p.id === botJid || ownerList.includes(p.id)) continue;
            
            const lastSeen = chatActividad[p.id] || 0;

            if ((lastSeen === 0 && tiempoTranscurrido >= unDiaYMedio) || (lastSeen > 0 && (now - lastSeen) >= unDiaYMedio)) {
                inactivos.push(`@${p.id.split('@')[0]}`);
                mencionesJid.push(p.id);
            }
        }

        if (command === 'inactivos') {
            if (inactivos.length === 0) {
                return m.reply("『 ✨ ESTADO: EXCELENTE ✨ 』\n\nNo se detectaron usuarios inactivos. Todos han reportado actividad en el último día y medio.");
            }

            let txt = "『 📡 REPORTE DE INACTIVIDAD 📡 』\n\n";
            txt += `Se han detectado ${inactivos.length} usuarios sin señales de vida (1.5 días+):\n\n`;
            txt += inactivos.join('\n');
            txt += `\n\n──────────────────\n`;
            txt += `> Usa ${usedPrefix}kickinactivos para proceder con la limpieza.`;
            
            return conn.sendMessage(m.chat, { text: txt, mentions: mencionesJid }, { quoted: m });
        }

        if (command === 'warninactivos') {
            if (inactivos.length === 0) return m.reply("✨ Nada que advertir por ahora.");

            let warnTxt = "『 ⚠️ ÚLTIMO AVISO DE ACTIVIDAD ⚠️ 』\n\n";
            warnTxt += "Los siguientes miembros (incluyendo admins) están en la lista negra por inactividad. Si no envían un mensaje ahora, serán eliminados:\n\n";
            warnTxt += inactivos.join('\n');
            warnTxt += `\n\n> ⏰ Tienen poco tiempo para reportarse.`;
            
            return conn.sendMessage(m.chat, { text: warnTxt, mentions: mencionesJid }, { quoted: m });
        }

        if (command === 'kickinactivos') {
            if (!isBotAdmin) return m.reply("⨯ El bot necesita ser Admin para purgar.");
            if (inactivos.length === 0) return m.reply("✨ No hay objetivos para la purga.");

            await conn.sendMessage(m.chat, { text: `『 🔥 INICIANDO PURGA QUIRÚRGICA 🔥 』\n\nEliminando a ${inactivos.length} miembros inactivos detectados por el radar de 1.5 días.` }, { quoted: m });
            
            let count = 0;
            for (let jid of mencionesJid) {
                await delay(2000); 
                try {
                    await conn.groupParticipantsUpdate(m.chat, [jid], "remove");
                    count++;
                } catch (e) {}
            }
            return m.reply(`『 ✔️ LIMPIEZA COMPLETADA 』\n\nSe han removido ${count} usuarios que no cumplieron con la actividad mínima.`);
        }
    }
};

export default inactivosCommand;
            
