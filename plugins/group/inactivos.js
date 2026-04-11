const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos', 'warninactivos'],
    category: 'group',

    // Este bloque registra el tiempo exacto cada vez que alguien envía un mensaje
    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!m.isGroup) return m.reply("⨯ Comando exclusivo para grupos.");

        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const now = Date.now();
        const limiteHoras = 48; // Puedes cambiar las horas de inactividad aquí
        const tiempoLimite = limiteHoras * 60 * 60 * 1000;

        let inactivos = [];
        let fantasmas = [];
        const groupAdmins = participants.filter(p => p.admin).map(p => p.id);

        // Clasificar usuarios
        for (let p of participants) {
            // Ignoramos al bot y a los administradores del grupo
            if (p.id === botJid || groupAdmins.includes(p.id)) continue;

            const lastSeen = global.actividadGrupo[m.chat][p.id] || 0;

            if (lastSeen === 0) {
                fantasmas.push({ id: p.id }); // Cero actividad desde el último reinicio del bot
            } else if ((now - lastSeen) >= tiempoLimite) {
                inactivos.push({ id: p.id, time: lastSeen }); // Actividad antigua
            }
        }

        // Ordenar los inactivos del que tiene más tiempo al que tiene menos
        inactivos.sort((a, b) => a.time - b.time);
        const totalObjetivos = inactivos.length + fantasmas.length;

        /* =======================================================
           COMANDO 1: MONITOR DE INACTIVOS (.inactivos)
        ======================================================= */
        if (command === 'inactivos') {
            let txt = "『 MONITOR DE ACTIVIDAD 』\n\n";
            txt += `✦ Limite: ${limiteHoras} Horas\n`;
            txt += `✦ Total Detectados: ${totalObjetivos} miembros\n`;
            txt += `──────────────────\n\n`;

            if (totalObjetivos === 0) {
                txt += "◈ El grupo esta completamente activo. ¡Excelente!\n";
                return conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
            }

            if (inactivos.length > 0) {
                txt += `[ ⚠️ ] ── USUARIOS INACTIVOS (+${limiteHoras}h)\n\n`;
                for (let i = 0; i < inactivos.length; i++) {
                    const u = inactivos[i];
                    const d = new Date(u.time);
                    const dateStr = `${d.toISOString().substring(0, 10)} | ${d.toISOString().substring(11, 16)} UTC`;
                    txt += `◈ @${u.id.split('@')[0]} ➭ Visto: ${dateStr}\n`;
                }
                txt += `\n──────────────────\n\n`;
            }

            if (fantasmas.length > 0) {
                txt += `[ 👻 ] ── FANTASMAS (Sin registro reciente)\n\n`;
                for (let i = 0; i < fantasmas.length; i++) {
                    txt += `◈ @${fantasmas[i].id.split('@')[0]}\n`;
                }
                txt += `\n──────────────────\n`;
            }

            txt += `\n> Usa *.warninactivos* para advertirles o *.kickinactivos* para el menu de purga.`;

            // Mencionamos a los usuarios para que el formato @numero se vea bien, pero sin notificar agresivamente
            const allMentions = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];
            return conn.sendMessage(m.chat, { text: txt.trim(), mentions: allMentions }, { quoted: m });
        }

        /* =======================================================
           COMANDO 2: ADVERTENCIA GENERAL (.warninactivos)
        ======================================================= */
        if (command === 'warninactivos') {
            const isBotAdmin = participants.find(p => p.id === botJid)?.admin;
            const isAdmin = groupAdmins.includes(m.sender);
            
            if (!isAdmin) return m.reply("⨯ Acceso restringido: Solo Administradores.");
            if (totalObjetivos === 0) return m.reply("⨯ No hay usuarios inactivos para advertir.");

            let warnTxt = "『 ⚠️ ADVERTENCIA DE INACTIVIDAD ⚠️ 』\n\n";
            warnTxt += `El sistema ha detectado inactividad o falta de participacion en los siguientes usuarios. Por favor, envien un mensaje para evitar ser eliminados en la proxima limpieza.\n\n`;
            
            const allTargets = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];
            for (let id of allTargets) {
                warnTxt += `◈ @${id.split('@')[0]}\n`;
            }
            
            warnTxt += `\n──────────────────\n`;
            warnTxt += `✦ Administrador a cargo: @${m.sender.split('@')[0]}`;

            return conn.sendMessage(m.chat, { text: warnTxt, mentions: [...allTargets, m.sender] }, { quoted: m });
        }

        /* =======================================================
           COMANDO 3: MENÚ Y EJECUCIÓN DE PURGA (.kickinactivos)
        ======================================================= */
        if (command === 'kickinactivos') {
            const isBotAdmin = participants.find(p => p.id === botJid)?.admin;
            const isAdmin = groupAdmins.includes(m.sender);

            if (!isAdmin) return m.reply("⨯ Acceso restringido: Solo Administradores.");
            if (!isBotAdmin) return m.reply("⨯ Error: El bot necesita ser administrador para expulsar.");

            const option = args[0] ? args[0].toLowerCase() : '';

            if (!['all', 'inactivos', 'fantasmas'].includes(option)) {
                let menu = "『 GESTION DE LIMPIEZA 』\n\n";
                menu += `◈ Comando: ${usedPrefix + command} [opcion]\n\n`;
                menu += `◈ Opciones disponibles:\n`;
                menu += `➭ inactivos : Purga solo a los inactivos confirmados (+${limiteHoras}h)\n`;
                menu += `➭ fantasmas : Purga solo a los que no tienen registro\n`;
                menu += `➭ all : Purga total (Inactivos + Fantasmas)\n\n`;
                menu += `✦ Objetivos actuales: ${totalObjetivos}\n`;
                menu += `✦ Nota: Los Administradores estan exentos automaticamente.`;
                
                return conn.sendMessage(m.chat, { text: menu }, { quoted: m });
            }

            let targetsToKick = [];
            if (option === 'inactivos') targetsToKick = inactivos.map(u => u.id);
            if (option === 'fantasmas') targetsToKick = fantasmas.map(u => u.id);
            if (option === 'all') targetsToKick = [...inactivos.map(u => u.id), ...fantasmas.map(u => u.id)];

            if (targetsToKick.length === 0) return m.reply("⨯ No hay objetivos en esta categoria para eliminar.");

            await conn.sendMessage(m.chat, { 
                text: `『 EJECUTANDO PURGA 』\n\n◈ Categoria: ${option.toUpperCase()}\n◈ Objetivos: ${targetsToKick.length}\n◈ Intervalo: 2s por seguridad anti-lag...` 
            }, { quoted: m });

            let expulsados = 0;
            for (let id of targetsToKick) {
                await delay(2000);
                try {
                    await conn.groupParticipantsUpdate(m.chat, [id], "remove");
                    expulsados++;
                } catch (e) {
                    console.log(`No se pudo expulsar a ${id}`);
                }
            }

            return conn.sendMessage(m.chat, { text: `『 PROCESO FINALIZADO 』\n\n✦ Usuarios eliminados: ${expulsados}` }, { quoted: m });
        }
    }
};

export default inactivosCommand;
    
