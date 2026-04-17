import { getRealJid } from '../../lib/identifier.js'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const demoteCommand = {
    name: 'demote',
    alias: ['quitaradmin', 'unadmin'],
    category: 'group',
    group: true,
    botAdmin: true,
    admin: true,
    run: async (m, { conn }) => {
        try {
            let rawWho = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
            if (!rawWho) return conn.reply(m.chat, `> ⌬ *_Debes etiquetar a alguien o responder a su mensaje._*`, m);

            const who = jidNormalizedUser(await getRealJid(conn, rawWho, m));
            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants || [];

            const targetUser = participants.find(p => 
                jidNormalizedUser(p.id) === who || 
                (p.phoneNumber && jidNormalizedUser(p.phoneNumber) === who)
            );

            if (!targetUser) return conn.reply(m.chat, `> ❌ *_El usuario no se encuentra en el grupo._*`, m);

            const isTargetAdmin = targetUser.admin === 'admin' || targetUser.admin === 'superadmin';

            if (!isTargetAdmin) {
                return conn.reply(m.chat, `> ✰ *_El usuario @${who.split('@')[0]} no es administrador._*`, m, { mentions: [who] });
            }

            let date = new Date().toLocaleDateString('es-HN');
            await conn.groupParticipantsUpdate(m.chat, [targetUser.id], 'demote');

            let txt = `*─── [ ⍰ DEMOTE ] ───*\n\n`;
            txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
            txt += `*✰ Estado:* Administrador removido\n`;
            txt += `*➠ Fecha:* ${date}\n\n`;

            await conn.reply(m.chat, txt, m, { mentions: [who] });

        } catch (e) {
            console.error(e);
            conn.reply(m.chat, `> ❌ *_Error al degradar al usuario._*`, m);
        }
    }
};

export default demoteCommand;
