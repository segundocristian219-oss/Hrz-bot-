import { getRealJid } from '../../lib/identifier.js'

const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'unadmin'],
    category: 'owner',
    group: true,
    botAdmin: true,
    admin: true,
    run: async (m, { conn }) => {
        try {
            
            let rawWho = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;

            if (!rawWho) return conn.reply(m.chat, `> ⌬ *_Debes etiquetar a alguien o responder a su mensaje._*`, m);

            
            const who = await getRealJid(conn, rawWho, m);

            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const targetUser = participants.find(p => p.id === who);

            const isTargetAdmin = targetUser?.admin !== null && targetUser?.admin !== undefined;

            if (!isTargetAdmin) {
                return conn.reply(m.chat, `> ✰ *_El usuario @${who.split('@')[0]} no es administrador._*`, m, { mentions: [who] });
            }

            let date = new Date().toLocaleDateString('es-HN');

            await conn.groupParticipantsUpdate(m.chat, [who], 'demote');

            let txt = `*─── [ ⍰ DEMOTE ] ───*\n\n`;
            txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
            txt += `*✰ Estado:* Administrador removido\n`;
            txt += `*➠ Fecha:* ${date}\n\n`;

            await conn.reply(m.chat, txt, m, { mentions: [who] });

        } catch (e) {
            console.error(e);
            conn.reply(m.chat, `> ❌ *_Error al degradar al usuario. Verifica mis permisos._*`, m);
        }
    }
};

export default demoteCommand;
