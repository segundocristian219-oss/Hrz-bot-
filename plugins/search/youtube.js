import yts from 'yt-search';

const ytSearchCommand = {
    name: 'ytsearch',
    alias: ['yts'],
    category: 'search',
    run: async (m, { conn, text, command }) => {
        if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término]`);

        m.react('🔍');

        try {
            const search = await yts(text);
            const vid = search.videos[0];

            if (!vid) {
                m.react('❌');
                return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se detectaron resultados.`);
            }

            const mensaje = `❯❯ 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛\n\n` +
                            `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${vid.title}\n` +
                            `❖ 𝗜𝗗: ${vid.videoId}\n` +
                            `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${vid.timestamp}\n` +
                            `❖ 𝗩𝗜𝗦𝗧𝗔𝗦: ${vid.views.toLocaleString()}\n` +
                            `❖ 𝗣𝗨𝗕𝗟𝗜𝗖𝗔𝗗𝗢: ${vid.ago}\n` +
                            `❖ 𝗔𝗨𝗧𝗢𝗥: ${vid.author.name}\n` +
                            `❖ 𝗘𝗡𝗟𝗔𝗖𝗘: ${vid.url}`;

            await conn.sendMessage(m.chat, { 
                text: mensaje,
                contextInfo: {
                    externalAdReply: {
                        title: vid.title,
                        body: `Canal: ${vid.author.name}`,
                        mediaType: 1,
                        thumbnailUrl: vid.thumbnail,
                        renderLargerThumbnail: true,
                        sourceUrl: vid.url
                    }
                }
            }, { quoted: m });

            m.react('✅');

        } catch (e) {
            console.error(e);
            m.react('❌');
        }
    }
};

export default ytSearchCommand;
