import { getRealJid } from '../../lib/identifier.js'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const promoteCommand = {
    name: 'promote',
    alias: ['daradmin'],
    category: 'owner',
    group: true,
    botAdmin: true,
    admin: true,
    run: async (m, { conn }) => {
        try {
            let rawWho = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
            if (!rawWho) return conn.reply(m.chat, `> ♛ *_Debes etiquetar a alguien o responder a su mensaje._*`, m);

            const who = jidNormalizedUser(await getRealJid(conn, rawWho, m));
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({ participants: [] }));
            const participants = groupMetadata.participants || [];

            const targetUser = participants.find(p => 
                jidNormalizedUser(p.id) === who || 
                (p.lid && jidNormalizedUser(p.lid) === who)
            );

            if (!targetUser) return conn.reply(m.chat, `> ❌ *_El usuario no se encuentra en el grupo._* ${targetUser}`, m);

            const isTargetAdmin = !!(targetUser.admin || targetUser.isCommunityAdmin);

            if (isTargetAdmin) {
                return conn.reply(m.chat, `> ✎ *_El usuario @${who.split('@')[0]} ya es administrador._*`, m, { mentions: [who] });
            }

            let date = new Date().toLocaleDateString('es-HN');
            await conn.groupParticipantsUpdate(m.chat, [who], 'promote');

            let txt = `*─── [ ♛ PROMOTE ] ───*\n\n`;
            txt += `*♛ Usuario:* @${who.split('@')[0]}\n`;
            txt += `*✰ Estado:* Nuevo administrador\n`;
            txt += `*➠ Fecha:* ${date}\n\n`;

            await conn.reply(m.chat, txt, m, { mentions: [who] });

        } catch (e) {
            console.error(e);
            conn.reply(m.chat, `> ❌ *_Error al promover al usuario._*`, m);
        }
    }
};

export default promoteCommand;
