const antiStatus = {
    name: 'antistatus_vx',
    async before(m, { conn, isAdmin, isBotAdmin, isOwner, chat }) {
        if (!m.isGroup || !chat?.antiStatus || isOwner || isAdmin || m.fromMe) return false;

        
        const isStatusMention = !!m.message?.groupStatusMentionMessage || 
                               m.message?.groupStatusMentionMessage?.message?.protocolMessage?.type === 'STATUS_MENTION_MESSAGE';

        if (isStatusMention) {
            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key });
                await conn.sendMessage(m.chat, { 
                    text: `*「 ANTI ESTADOS 」*\n\n> @${m.sender.split('@')[0]}, las menciones de estado no están permitidas. Mensaje eliminado.`, 
                    mentions: [m.sender] 
                });
            }
            return true;
        }
        return false;
    }
};

export default antiStatus;
