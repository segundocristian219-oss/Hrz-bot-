const promoteCommand = {
    name: 'promote',
    alias: ['daradmin'],
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
                    `> ♛ *_Debes etiquetar a alguien o responder a su mensaje para promoverlo._*`, 
                    m
                );
            }

            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const targetUser = participants.find(p => p.id === who);
            const isTargetAdmin = targetUser?.admin || targetUser?.isSuperAdmin || false;

            if (isTargetAdmin) {
                return conn.reply(
                    m.chat,
                    `> ✎ *_El usuario @${who.split('@')[0]} ya es administrador._*`,
                    m,
                    { mentions: [who] }
                );
            }

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            try {
                await conn.groupParticipantsUpdate(m.chat, [who], 'promote');

                let txt = `*─── [ ♛ PROMOTE ] ───*\n\n`;
                txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
                txt += `*✰ Estado:* Nuevo administrador\n`;
                txt += `*➠ Fecha:* ${date}\n\n`;


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

export default promoteCommand;
