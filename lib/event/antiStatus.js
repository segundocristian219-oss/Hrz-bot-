import { jidNormalizedUser } from '@whiskeysockets/baileys';
import chalk from 'chalk';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || m.key.remoteJid !== 'status@broadcast') return;

            const sender = m.key.participant || m.key.remoteJid;
            const botJid = jidNormalizedUser(conn.user.id);
            
            if (global.db.data == null) await global.loadDatabase();
            const db = global.db.data;

            const chatConfig = db.chats[sender] || db.chats[jidNormalizedUser(sender)];
            if (!chatConfig?.antiStatus) return;

            const text = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                ""
            ).toLowerCase();

            const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9a-z]{20,24})/i;

            if (linkRegex.test(text)) {
                console.log(chalk.red(`┃ [ANTI-STATUS] Bloqueando a: ${sender}`));

                await conn.updateBlockStatus(sender, 'block');

                const ownerJid = global.owner[0][0] + '@s.whatsapp.net';
                await conn.sendMessage(ownerJid, {
                    text: `*「 ANTI-STATUS 」*\n\n@${sender.split('@')[0]} bloqueado por spam en estados.\n\n*Texto:* ${text}`,
                    mentions: [sender]
                });
            }
        } catch (e) {
            console.error(e);
        }
    });
}
