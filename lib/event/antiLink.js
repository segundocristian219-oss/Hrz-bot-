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

            if (linkRegex.test(text) || linkRegex1.test(text)) {
                // Forzamos la obtención de metadata fresca
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];
                
                // Obtenemos el ID del bot de forma ultra segura
                const botJid = jidNormalizedUser(conn.user?.id);

                // Verificación de Admin para el Bot
                const botPart = participants.find(p => jidNormalizedUser(p.id) === botJid);
                const isBotAdmin = botPart?.admin === 'admin' || botPart?.admin === 'superadmin' || !!botPart?.isCommunityAdmin;

                // Verificación de Admin para el Usuario
                const userPart = participants.find(p => jidNormalizedUser(p.id) === sender);
                const isAdmin = userPart?.admin === 'admin' || userPart?.admin === 'superadmin' || !!userPart?.isCommunityAdmin;
                
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                // Si es el link de este mismo grupo, lo ignoramos
                const code = await conn.groupInviteCode(chatJid).catch(() => null);
                if (code && text.includes(code)) return;

                if (isBotAdmin) {
                    // ELIMINAR PRIMERO PARA EVITAR QUE EL USUARIO SIGA HACIENDO SPAM
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                    
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} fue eliminado por enviar enlaces.`, 
                        mentions: [sender] 
                    });
                } else {
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Los enlaces no están permitidos.\n\n> Dale admin al Bot para poder eliminar.`, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            console.error("[AntiLink Error]:", e);
        }
    });
}
