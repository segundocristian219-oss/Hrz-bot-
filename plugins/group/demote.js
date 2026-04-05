const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'unadmin'],
    category: 'owner',
    group: true,
    botAdmin: true,
    admin: true,
    run: async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
        try {

            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            try {
                await conn.groupParticipantsUpdate(m.chat, [who], 'demote');

                let txt = `*─── [ ⍰ DEMOTE ] ───*\n\n`;
                txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                txt += `*✰ Estado:* Administrador removido\n`;
                txt += `*➠ Fecha:* ${date} | ${time}\n\n`;
                txt += `_Acceso de owner verificado correctamente._`;

                await conn.reply(m.chat, txt, m, { mentions: [who] });

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
