import { jidNormalizedUser } from '@whiskeysockets/baileys';

const antiLinkPlugin = {
    //name: 'antilink_pro',
    async before(m, { conn, isAdmin, isBotAdmin, isOwner, chat }) {
        if (!m.isGroup || !chat?.antiLink || isOwner || isAdmin || m.fromMe) return false;

        
        const text = (
            m.text || 
            m.msg?.text || 
            m.msg?.caption || 
            m.message?.conversation || 
            m.message?.extendedTextMessage?.text || 
            m.message?.buttonsMessage?.contentText || 
            m.message?.listMessage?.description || 
            ""
        ).trim();

        const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
        const channelRegex = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;
        
        
        const isChannelForward = m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo || 
                                 m.msg?.contextInfo?.forwardedNewsletterMessageInfo;

        if (linkRegex.test(text) || channelRegex.test(text) || isChannelForward) {
            
            
            if (linkRegex.test(text)) {
                const code = await conn.groupInviteCode(m.chat).catch(() => null);
                if (code && text.includes(code)) return false;
            }

            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key });
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');

                await conn.sendMessage(m.chat, { 
                    text: `*「 ENLACE DETECTADO 」*\n\n@${m.sender.split('@')[0]} ha sido eliminado por enviar enlaces no permitidos.`, 
                    mentions: [m.sender] 
                });
            } else {
                await conn.sendMessage(m.chat, { 
                    text: `*「 ENLACE DETECTADO 」*\n\n@${m.sender.split('@')[0]} los enlaces no están permitidos. Necesito ser admin para aplicar la sanción.`, 
                    mentions: [m.sender] 
                }, { quoted: m });
            }
            return true; 
        }
        return false;
    }
};

export default antiLinkPlugin;
