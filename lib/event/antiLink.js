import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const sender = await getRealJid(conn, m.key.participant || m.key.remoteJid, m);

            // 1. Verificación de Base de Datos
            if (!global.db?.data?.chats[chatJid]?.antiLink) return;

            // 2. Extracción de texto de múltiples fuentes
            const text = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                m.message.groupInviteMessage?.caption || 
                m.message.documentWithCaptionMessage?.message?.documentMessage?.caption ||
                ""
            ).toLowerCase();

            const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9a-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9a-z]{20,24})/i;
            const isChannelForward = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (linkRegex.test(text) || linkRegex1.test(text) || isChannelForward) {
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

                // Evitar que borre el propio link del grupo
                if (linkRegex.test(text)) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code.toLowerCase())) return;
                }

                if (isBotAdmin) {
                    // ORDEN: Borrar -> Avisar -> Eliminar
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} no se permiten enlaces aquí.`, 
                        mentions: [sender] 
                    });

                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                } else {
                    await conn.sendMessage(chatJid, { 
                        text: `*「 AVISO DE ENLACE 」*\n\n@${sender.split('@')[0]} Enlaces prohibidos.\n\n> Necesito ser Administrador para expulsar al usuario.`, 
                        mentions: [sender] 
                    });
                }
            }
        } catch (e) {
            // Error silencioso para no llenar la consola
        }
    });
}
