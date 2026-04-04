const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'unadmin'],
    category: 'owner',
    group: true,
    run: async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
        try {
            const isOwner = global.owner.map(v => v[0] + '@s.whatsapp.net').includes(m.sender);
            if (!isOwner) {
                global.dfail('owner', m, conn);
                return;
            }

            if (!isBotAdmin) {
                global.dfail('botAdmin', m, conn);
                return;
            }

            if (!isAdmin) {
                return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n_No eres administrador, por lo que no es necesario el comando._`, m);
            }

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            try {
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'demote');

                let txt = `*─── [ 🛡️ DEMOTE ] ───*\n\n`;
                txt += `*♛ Usuario:* @${m.sender.split`@`[0]}\n`;
                txt += `*✰ Estado:* Administrador removido\n`;
                txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                txt += `_Acceso de owner verificado correctamente._`;

                await conn.reply(m.chat, txt, m, { mentions: [m.sender] });

            } catch (err) {
                console.error(err);
                conn.reply(m.chat, `*─── [ ❌ ERROR ] ───*\n\n_No se pudo completar la acción. Revisa los permisos del bot._`, m);
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default demoteCommand;
