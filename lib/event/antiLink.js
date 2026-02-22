import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            
            // Acceso a la base de datos global
            if (!global.db?.data) return;
            const chat = global.db.data.chats[chatJid];
            if (!chat || !chat.antiLink) return;

            // Extracción robusta de texto (Mensaje simple, con formato, de imagen o video)
            const text = m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "";

            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;
            
            const isGroupLink = linkRegex.test(text) || linkRegex1.test(text);
            const isChannelForward = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (isGroupLink || isChannelForward) {
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({ participants: [] }));
                const participants = groupMetadata.participants || [];
                const botJid = jidNormalizedUser(conn.user.id);
                
                const isBotAdmin = participants.find(p => jidNormalizedUser(p.id) === botJid)?.admin;
                const isAdmin = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender))?.admin;
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                // Validar si es el link del propio grupo
                if (isGroupLink && text.includes('chat.whatsapp.com/')) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code)) return;
                }

                await conn.sendMessage(chatJid, { 
                    text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Los enlaces no están permitidos.`, 
                    mentions: [sender] 
                }, { quoted: m });

                if (isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                }
            }
        } catch (e) {
            console.error("[Error en AntiLink Event]:", e);
        }
    });
}
