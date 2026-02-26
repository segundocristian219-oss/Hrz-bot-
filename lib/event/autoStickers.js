import { getRealJid } from '../identifier.js';

const STICKER_GROUPS = [
    {
        keywords: ['xd'],
        links: [ 
'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772071735104.webp'
        ]
    },
    {
        keywords: ['jaja', 'jajaja'],
        links: [
          'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772073234187.webp'
        ]
    },
    {
        keywords: ['hola', 'hi', 'hello'],
        links: [
'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077499099.webp',
'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077472503.webp'
         ]
    }
];

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            
            if (!m.message || m.key.fromMe || !m.key.remoteJid?.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            if (!global.db?.data) return;
            
            const chat = global.db.data.chats[chatJid];
            if (!chat || !chat.autoStickers) return;

            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").trim().toLowerCase();

            
            const group = STICKER_GROUPS.find(g => g.keywords.includes(text));

            if (group) {
                
                const randomLink = group.links[Math.floor(Math.random() * group.links.length)];

                await conn.sendMessage(chatJid, { 
                    sticker: { url: randomLink } 
                }, { quoted: m });
            }

        } catch (e) {
            console.error('Error en Auto-Sticker Opt:', e);
        }
    });
}
