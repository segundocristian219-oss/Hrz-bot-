import yts from 'yt-search';

const ytSearchCommand = {
    name: 'ytsearch',
    alias: ['yts', 'buscar'],
    category: 'search',
    run: async (m, { conn, text, command }) => {
        if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término]\nEjemplo: .${command} phillip ryan`);

        m.react('🔍');

        try {
            const search = await yts(text);
            const resultados = search.videos.slice(0, 3);

            if (!resultados.length) {
                m.react('❌');
                return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se hallaron resultados.`);
            }

            const items = resultados.map(vid => 
                `❒── 「 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 」 ──\n` +
                `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${vid.title}\n` +
                `❖ 𝗖𝗔𝗡𝗔𝗟: ${vid.author.name}\n` +
                `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${vid.timestamp}\n` +
                `❖ 𝗘𝗡𝗟𝗔𝗖𝗘: ${vid.url}`
            ).join('\n\n');

            const mensaje = `❯❯ 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛\n\n❖ 𝗕𝗨𝗦𝗤𝗨𝗘𝗗𝗔: ${text.toUpperCase()}\n\n${items}`;

            conn.sendMessage(m.chat, { 
                text: mensaje,
                contextInfo: {
                    externalAdReply: {
                        title: "𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛",
                        body: "Resultados obtenidos localmente",
                        mediaType: 1,
                        thumbnailUrl: resultados[0].thumbnail,
                        renderLargerThumbnail: false,
                        sourceUrl: resultados[0].url
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
