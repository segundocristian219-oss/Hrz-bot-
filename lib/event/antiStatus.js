import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message && !m.messageStubType) return;

            const chatJid = m.key.remoteJid;
            if (!chatJid.endsWith('@g.us')) return;

            if (global.db.data == null) await global.loadDatabase();
            const chat = global.db.data.chats[chatJid];
            if (!chat?.antiStatus) return;

            const isStatusMention = 
                m.messageStubType === 118 || 
                m.message?.protocolMessage?.type === 118 ||
                (m.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceType === 'status') ||
                m.message?.extendedTextMessage?.text?.includes('subió un estado y te mencionó');

            if (isStatusMention) {
                const groupMetadata = await conn.groupMetadata(chatJid);
                const participants = groupMetadata.participants || [];
                const botJid = jidNormalizedUser(conn.user.id);
                
                const sender = m.key.participant || m.author || m.key.remoteJid;
                const isAdmin = participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender) && (p.admin || p.isCommunityAdmin));
                const isBotAdmin = participants.some(p => jidNormalizedUser(p.id) === botJid && (p.admin || p.isCommunityAdmin));

                if (!isAdmin && isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
}
