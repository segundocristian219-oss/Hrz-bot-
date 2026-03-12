import { jidNormalizedUser } from '@whiskeysockets/baileys';

const antiStatus = {
    name: 'antistatus_vx',
    async before(m, { conn, isAdmin, isBotAdmin, isOwner, chat }) {
        if (!m.isGroup || !chat?.antiStatus || isOwner || isAdmin || m.fromMe) return false;

        const isStatusMention = !!m.message?.groupStatusMentionMessage || 
                               !!m.msg?.groupStatusMentionMessage ||
                               m.message?.protocolMessage?.type === 'STATUS_MENTION_MESSAGE';

        if (isStatusMention) {
            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key });
                await conn.sendMessage(m.chat, { 
                    text: `*「 ANTI ESTADOS 」*\n\n> @${m.sender.split('@')[0]}, no se permiten los estados en este grupo. La opción anti estado está activa por lo tanto este mensaje fue eliminado.`, 
                    mentions: [m.sender] 
                });
            }
            return true;
        }
        return false;
    }
};

export default antiStatus;
