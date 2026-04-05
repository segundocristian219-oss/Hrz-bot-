const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'unadmin'],
    category: 'owner',
    group: true,
    botAdmin: true,
    admin: true,
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            
            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;

            if (!who) {
                return conn.reply(
                    m.chat, 
                    `*─── [ ⚠ ADVERTENCIA ] ───*\n\n_Debes etiquetar a alguien o responder a su mensaje para degradarlo._\n\n*Ejemplo:* ${usedPrefix + command} @usuario`, 
                    m
                );
            }

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            try {
                
                await conn.groupParticipantsUpdate(m.chat, [who], 'demote');

                let txt = `*─── [ ⍰ DEMOTE ] ───*\n\n`;
                txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                txt += `*✰ Estado:* Administrador removido\n`;
                txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                txt += `_Acceso verificado correctamente._`;

                await conn.reply(m.chat, txt, m, { mentions: [who] });

            } catch (err) {
                console.error(err);
                conn.reply(m.chat, `*─── [ ❌ ERROR ] ───*\n\n_No se pudo completar la acción. Asegúrate de que el usuario sea administrador._`, m);
            }

        } catch (e) {
            console.error(e);
        }
    }
};

export default demoteCommand;
