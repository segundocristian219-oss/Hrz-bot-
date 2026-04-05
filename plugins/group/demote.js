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

            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;

            const groupMetadata = await conn.groupMetadata(m.chat);
            const ownerGroup = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net';

            if (who === ownerGroup) {
                return conn.reply(m.chat, `*─── [ ❌ ADVERTENCIA ] ───*\n\n_No es posible quitarle el administrador a @${who.split('@')[0]} porque es el *Creador del Grupo*._\n\n_Jerarquía de WhatsApp respetada._`, m, { mentions: [who] });
            }

            if (who === m.sender && !isAdmin) {
                return conn.reply(m.chat, `*─── [ ✅ INFO ] ───*\n\n_No eres administrador, por lo que no es necesario el comando._`, m);
            }

            let d = new Date();
            let time = d.toLocaleTimeString('es-HN', { hour: 'numeric', minute: 'numeric', hour12: true });
            let date = d.toLocaleDateString('es-HN');

            try {
                await conn.groupParticipantsUpdate(m.chat, [who], 'demote');

                let txt = `*─── [ 🛡️ DEMOTE ] ───*\n\n`;
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
                
