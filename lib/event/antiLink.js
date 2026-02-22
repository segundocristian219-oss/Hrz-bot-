import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const sender = m.key.participant || chatJid;
            
            if (global.db.data == null) await global.loadDatabase();
            const chat = global.db.data.chats[chatJid];
            
            if (!chat || !chat.antiLink) return;

            const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;
            const isGroupLink = linkRegex.exec(text) || linkRegex1.exec(text);
            const isChannelForward = m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (isGroupLink || isChannelForward) {
                const botJid = jidNormalizedUser(conn.user.id);
                const groupMetadata = await conn.groupMetadata(chatJid);
                const participants = groupMetadata.participants || [];
                
                const isBotAdmin = participants.find(p => jidNormalizedUser(p.id) === botJid)?.admin;
                const isAdmin = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender))?.admin;
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                const linkThisGroup = isGroupLink ? `https://chat.whatsapp.com/${await conn.groupInviteCode(chatJid).catch(() => '')}` : '';
                if (linkThisGroup && text.includes(linkThisGroup)) return;

                await conn.sendMessage(chatJid, { 
                    text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Rompiste las reglas del grupo.`, 
                    mentions: [sender] 
                }, { quoted: m });

                if (isBotAdmin) {
                    await conn.sendMessage(chatJid, { delete: m.key });
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                }
            }
        } catch (e) {
            // Error silencioso para no interrumpir el flujo principal
        }
    });
}
