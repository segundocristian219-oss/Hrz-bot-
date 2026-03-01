import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            
            const chat = await global.Chat.findOne({ id: chatJid });
            if (!chat || !chat.antiLink) return;

            const sender = await getRealJid(conn, m.key.participant || m.key.remoteJid, m);

            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").trim();

            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;
            const isChannelForward = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (linkRegex.test(text) || linkRegex1.test(text) || isChannelForward) {
                const groupMetadata = global.groupCache?.get(chatJid) || await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];

                const getAdminStatus = (targetJid, targetLid) => {
                    const p = participants.find(p => 
                        jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || 
                        (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetJid)) ||
                        (targetLid && jidNormalizedUser(p.id) === jidNormalizedUser(targetLid)) ||
                        (p.lid && targetLid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetLid))
                    );
                    return !!(p?.admin || p?.isCommunityAdmin);
                };

                const isBotAdmin = getAdminStatus(conn.user.id, conn.user.lid);
                const isAdmin = getAdminStatus(sender);
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                if (linkRegex.test(text)) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code)) return;
                }

                if (isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} fue eliminado por enviar enlaces no permitidos.`, 
                        mentions: [sender] 
                    });
                } else {
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Los enlaces no están permitidos, pero necesito ser Administrador para aplicar la sanción.`, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            console.error('Error en AntiLink:', e);
        }
    });
}
