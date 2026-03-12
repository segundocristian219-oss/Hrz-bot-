const STICKER_GROUPS = [
    { keywords: ['xd'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772071735104.webp'] },
    { keywords: ['jaja', 'jajaja'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772073234187.webp'] },
    { keywords: ['mua', 'beso', '💋'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772658902972.webp', 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772659117883.webp'] },
    { keywords: ['hola', 'hi', 'hello'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077499099.webp', 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772077472503.webp'] },
    { keywords: ['te amo', 'love you', 'amor'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167016084.webp', 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167006565.webp'] },
    { keywords: ['pendejo', 'puto', 'rata'], links: ['https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772166977879.webp', 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167220157.webp', 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772167257254.webp'] }
];

const autoSticker = {
    name: 'autosticker_vx',
    async before(m, { chat }) {
        if (!m.isGroup || !chat?.autoStickers || m.fromMe || m.isBaileys) return false;

        const text = (m.text || "").toLowerCase().trim();
        if (!text) return false;

        const group = STICKER_GROUPS.find(g => g.keywords.some(k => text.startsWith(k)));

        if (group) {
            const randomLink = group.links[Math.floor(Math.random() * group.links.length)];
            await this.sendMessage(m.chat, { 
                sticker: { url: randomLink },
                contextInfo: {
                      externalAdReply: {
                        title: name(),
                        body: groupMetadata.subject,
                        mediaType: 1,
                        sourceUrl: mainLink,
                        thumbnailUrl: img(),
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
            return true;
        }
        return false;
    }
};

export default autoSticker;
