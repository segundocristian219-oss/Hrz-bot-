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
                const isAdmin = participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender) && (p.admin || p.isCommunityAdmin));
                const isBotAdmin = participants.some(p => jidNormalizedUser(p.id) === botJid && (p.admin || p.isCommunityAdmin));

                if (!isAdmin && isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    await conn.sendMessage(chatJid, { 
                        text: `> ♛ @${sender.split('@')[0]}, no se permiten las menciones de estados en este grupo. La función *Anti-Estado* está activa para mantener el chat limpio.`,
                        mentions: [sender]
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
}
