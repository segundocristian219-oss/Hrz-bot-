import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const sender = await getRealJid(conn, m.key.participant || m.key.remoteJid, m);

            if (!global.db?.data) return;
            const chat = global.db.data.chats[chatJid];
            if (!chat || !chat.antiLink) return;

            const text = m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "";

            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;

            const isGroupLink = linkRegex.test(text) || linkRegex1.test(text);
            const isChannelForward = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (isGroupLink || isChannelForward) {
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];
                
                // FORMA SEGURA DE OBTENER EL ID DEL BOT
                const botJid = jidNormalizedUser(conn.user?.id || conn.decodeJid(conn.user?.id));

                // DETECCIÓN DE BOT ADMIN MEJORADA
                const botPart = participants.find(p => 
                    jidNormalizedUser(p.id) === botJid || 
                    (p.lid && jidNormalizedUser(p.lid) === botJid)
                );
                const isBotAdmin = botPart?.admin === 'admin' || botPart?.admin === 'superadmin';

                // DETECCIÓN DE USUARIO ADMIN
                const userPart = participants.find(p => 
                    jidNormalizedUser(p.id) === sender || 
                    (p.lid && jidNormalizedUser(p.lid) === sender)
                );
                const isAdmin = userPart?.admin === 'admin' || userPart?.admin === 'superadmin';

                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                if (isGroupLink) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code)) return;
                }

                if (isBotAdmin) {
                    // Acción inmediata
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                    
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} fue eliminado por enviar enlaces.`, 
                        mentions: [sender] 
                    });
                } else {
                    // Solo aviso si no es admin
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Los enlaces no están permitidos.\n\n> Dale admin al Bot para que pueda eliminar intrusos.`, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            // Ignorar errores de permisos o mensajes borrados
        }
    });
}
