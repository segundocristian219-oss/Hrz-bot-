import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            if (global.db.data == null) await global.loadDatabase();
            const chat = global.db.data.chats[chatJid];

            if (!chat?.antiStatus) return;

            const msg = m.message.extendedTextMessage || m.message.imageMessage || m.message.videoMessage || m.message;
            const contextInfo = msg?.contextInfo;

            const isStatusMention = contextInfo?.mentionedJid?.includes(chatJid) || 
                                   (contextInfo?.externalAdReply?.renderLargerThumbnail === false && contextInfo?.forwardingScore > 0);

            if (isStatusMention) {
                const groupMetadata = await conn.groupMetadata(chatJid);
                const participants = groupMetadata.participants || [];
                const botJid = jidNormalizedUser(conn.user.id);
                
                const isAdmin = participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(m.key.participant) && (p.admin || p.isCommunityAdmin));
                const isBotAdmin = participants.some(p => jidNormalizedUser(p.id) === botJid && (p.admin || p.isCommunityAdmin));

                if (!isAdmin && isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.sendMessage(chatJid, { 
                        text: `> ╰❒ @${m.key.participant.split('@')[0]}, no se permiten los estados en este grupo.`,
                        mentions: [m.key.participant]
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
}
