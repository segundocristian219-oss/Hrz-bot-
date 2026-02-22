import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            
            if (!global.db?.data?.chats?.[chatJid]?.antiLink) return;

            const sender = await getRealJid(conn, m.key.participant || m.key.remoteJid, m);

            const text = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                m.message.groupInviteMessage?.caption || 
                m.message.documentWithCaptionMessage?.message?.documentMessage?.caption ||
                m.message.documentMessage?.caption ||
                ""
            );

            const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;
            const isChannel = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (linkRegex.test(text) || linkRegex1.test(text) || isChannel) {
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const botJid = jidNormalizedUser(conn.user.id);
                const participants = groupMetadata.participants || [];

                const getAdminStatus = (targetJid) => {
                    const p = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
                    return !!(p?.admin || p?.isCommunityAdmin);
                };

                const isBotAdmin = getAdminStatus(botJid);
                const isAdmin = getAdminStatus(sender);
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                if (linkRegex.test(text)) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code)) return;
                }

                if (isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Enviar enlaces está prohibido.`, 
                        mentions: [sender] 
                    });

                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                } else {
                    await conn.sendMessage(chatJid, { 
                        text: `*「 AVISO 」*\n\n@${sender.split('@')[0]} Enlaces prohibidos.\n\n> El bot debe ser Admin para eliminar.`, 
                        mentions: [sender] 
                    });
                }
            }
        } catch (e) {
            console.error("Error en AntiLink:", e);
        }
    });
}
