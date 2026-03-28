const STICKER_GROUPS = [
    { keywords: ['xd'], links: ['https://api.dix.lat/media2/1772071735104.webp'] },
    { keywords: ['que', 'como', 'a'], links: ['https://api.dix.lat/media2/1774670739905.webp', 'https://api.dix.lat/media2/1774670806828.webp', 'https://api.dix.lat/media2/1774670799889.webp'] },
    { keywords: ['jaja', 'jajaja'], links: ['https://api.dix.lat/media2/1772073234187.webp'] },
    { keywords: ['mua', 'beso', '💋'], links: ['https://api.dix.lat/media2/1772658902972.webp', 'https://api.dix.lat/media2/1772659117883.webp'] },
    { keywords: ['hola', 'hi', 'hello'], links: ['https://api.dix.lat/media2/1772077499099.webp', 'https://api.dix.lat/media2/1772077472503.webp'] },
    { keywords: ['te amo', 'love you', 'amor'], links: ['https://api.dix.lat/media2/1772167016084.webp', 'https://api.dix.lat/media2/1772167006565.webp'] },
    { keywords: ['pendejo', 'puto', 'rata'], links: ['https://api.dix.lat/media2/1772166977879.webp', 'https://api.dix.lat/media2/1772167220157.webp', 'https://api.dix.lat/media2/1772167257254.webp'] }
];

const autoSticker = {
    name: 'autosticker_vx',
    async before(m, { conn, chat }) {
        if (!m.isGroup || !chat?.autoStickers || m.fromMe || m.isBaileys) return false;

        const text = (m.text || "").toLowerCase().trim();
        if (!text) return false;

        const group = STICKER_GROUPS.find(g => g.keywords.some(k => text.startsWith(k)));

        if (group) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({ subject: 'Group' }));
            const randomLink = group.links[Math.floor(Math.random() * group.links.length)];

            await conn.sendMessage(m.chat, { 
                sticker: { url: randomLink },
                contextInfo: {
                    externalAdReply: {
                        title: global.name(),
                        body: groupMetadata.subject,
                        mediaType: 1,
                        sourceUrl: `https://chat.whatsapp.com/DeP5nWOhAdNFJrIiTsRoKl`,
                        thumbnailUrl: global.img(),
                        renderLargerThumbnail: false,
                        showAdAttribution: true
                    }
                }
            }, { quoted: m });
            return true;
        }
        return false;
    }
};

export default autoSticker;
