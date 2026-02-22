import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            if (global.db.data == null) await global.loadDatabase();
            const chat = global.db.data.chats[chatJid];

            if (!chat?.antiStatus) return;

            const isStatusMention = !!m.message?.groupStatusMentionMessage || 
                                   m.message?.groupStatusMentionMessage?.message?.protocolMessage?.type === 'STATUS_MENTION_MESSAGE';

            if (isStatusMention) {
                const botJid = jidNormalizedUser(conn.user.id);
                const groupMetadata = await conn.groupMetadata(chatJid);
                const participants = groupMetadata.participants || [];
                
                const sender = m.key.participant || m.author;
                const senderAlt = m.key.participantAlt; // Usamos el ID alternativo del JSON

                const checkAdmin = (id) => participants.some(p => 
                    jidNormalizedUser(p.id) === jidNormalizedUser(id) || 
                    (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(id))
                 && (p.admin || p.isCommunityAdmin));

                const isAdmin = checkAdmin(sender) || (senderAlt && checkAdmin(senderAlt));
                const isBotAdmin = participants.some(p => 
                    (jidNormalizedUser(p.id) === botJid || (p.lid && jidNormalizedUser(p.lid) === botJid)) 
                    && (p.admin || p.isCommunityAdmin)
                );

                if (!isAdmin && isBotAdmin) {
                    // Pequeña espera para que Baileys registre el mensaje antes de borrarlo
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    await conn.sendMessage(chatJid, { 
                        text: `> ╰❒ @${(senderAlt || sender).split('@')[0]}, no se permiten las menciones de estados en este grupo. La función *Anti-Estado* está activa.`,
                        mentions: [senderAlt || sender]
                    });
                }
            }
        } catch (e) {
            console.error('Error en Anti-Status:', e);
        }
    });
}
