import { jidNormalizedUser } from '@whiskeysockets/baileys';

export async function antiStatus(conn, m, chat, isAdmin, isBotAdmin, isOwner) {
    if (!m.isGroup || !chat?.antiStatus || isOwner || isAdmin || m.fromMe) return;

    const isStatusMention = 
        m.message?.protocolMessage?.type === 'STATUS_MENTION_MESSAGE' ||
        m.message?.groupStatusMentionMessage ||
        m.msg?.groupStatusMentionMessage;

    if (isStatusMention) {
        if (isBotAdmin) {
            try {
                await conn.sendMessage(m.chat, { delete: m.key });
                await conn.sendMessage(m.chat, { 
                    text: `*「 ANTI ESTADOS 」*\n\n> @${m.sender.split('@')[0]}, no se permiten los estados en este grupo. La opción anti estado está activa por lo tanto este mensaje fue eliminado.`, 
                    mentions: [m.sender] 
                });
            } catch (e) {
                console.error('Error al ejecutar AntiStatus:', e);
            }
        }
    }
}
