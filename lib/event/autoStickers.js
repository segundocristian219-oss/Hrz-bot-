import { getRealJid } from '../identifier.js';

const STICKER_GROUPS = [
    {
        keywords: ['xd'],
        links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772071735104.webp']
    },
    {
        keywords: ['jaja', 'jajaja'],
        links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772073234187.webp']
    },
    {
        keywords: ['hola', 'hi', 'hello'],
        links: [
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077499099.webp',
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077472503.webp'
         ]
    },
    {
         keywords: ['te amo', 'love you', 'amor'],
         links: [
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167016084.webp',
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167006565.webp'
         ]
    },
    {
         keywords: ['pendejo', 'puto', 'rata'],
         links: [
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772166977879.webp',
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167220157.webp',
            'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167257254.webp'
          ]
    }
];

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid?.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const chat = await global.Chat.findOne({ id: chatJid });

            if (!chat || !chat.autoStickers) return;

            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").toLowerCase().trim();

            if (!text) return;
            const group = STICKER_GROUPS.find(g => 
                g.keywords.some(keyword => text.startsWith(keyword))
            );

            if (group) {
                const randomLink = group.links[Math.floor(Math.random() * group.links.length)];
                
                await conn.sendMessage(chatJid, { 
                    sticker: { url: randomLink },
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363202750371906@newsletter',
                            serverMessageId: 100,
                            newsletterName: name()
                        }
                    }
                }, { quoted: m });
            }

        } catch (e) {
            console.error('Error en Auto-Sticker VX:', e);
        }
    });
}
