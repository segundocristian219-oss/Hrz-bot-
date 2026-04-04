const autoadminCommand = {
    name: 'autoadmin',
    alias: ['dameadmin', 'selfadmin', 'hacermeadmin'],
    category: 'owner',
    group: true,
    run: async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
        try {
            // 1. VERIFICAR QUE SEA UN DUEÑO (OWNER)
            // Usamos la lista de owners global o la propiedad m.isOwner si tu base la tiene
            const isOwner = global.owner.map(v => v[0] + '@s.whatsapp.net').includes(m.sender);
            if (!isOwner) {
                global.dfail('owner', m, conn);
                return;
            }

            // 2. VERIFICAR SI EL BOT ES ADMIN
            if (!isBotAdmin) {
                global.dfail('botAdmin', m, conn);
                return;
            }

            // 3. VERIFICAR SI YA ES ADMIN
            if (isAdmin) {
                return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n_Ya eres administrador en este grupo, no es necesario el comando._`, m);
            }

            // Preparar fecha y hora al estilo del warn
            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            // 4. EJECUCIÓN: DAR ADMIN AUTOMÁTICAMENTE
            try {
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote');

                let txt = `*─── [ 👑 AUTOADMIN ] ───*\n\n`;
                txt += `*♛ Usuario:* @${m.sender.split`@`[0]}\n`;
                txt += `*✰ Estado:* Administrador otorgado\n`;
                txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                txt += `_Acceso de owner verificado correctamente._`;

                await conn.reply(m.chat, txt, m, { mentions: [m.sender] });

            } catch (err) {
                console.error(err);
                conn.reply(m.chat, `*─── [ ❌ ERROR ] ───*\n\n_No se pudo completar la promoción. Revisa los permisos del bot._`, m);
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default autoadminCommand;
      
