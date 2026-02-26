import yts from 'yt-search';

const ytSearchCommand = {
    name: 'ytsearch',
    alias: ['yts', 'buscar'],
    category: 'search',
    run: async (m, { conn, text, command }) => {
        if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término]`);

        
        m.react('🔍');

        
        yts(text).then(async (search) => {
            const vid = search.videos[0]; 
            if (!vid) return m.react('❌');

            const mensaje = `❯❯ 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛\n\n` +
                            `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${vid.title}\n` +
                            `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${vid.timestamp}\n` +
                            `❖ 𝗘𝗡𝗟𝗔𝗖𝗘: ${vid.url}`;

            await conn.sendMessage(m.chat, { 
                text: mensaje,
                contextInfo: {
                    externalAdReply: {
                        title: vid.title,
                        body: vid.author.name,
                        mediaType: 1,
                        thumbnailUrl: vid.thumbnail,
                        renderLargerThumbnail: false,
                        sourceUrl: vid.url
                    }
                }
            }, { quoted: m });

            m.react('✅');
        }).catch(() => m.react('❌'));
    }
};

export default ytSearchCommand;
