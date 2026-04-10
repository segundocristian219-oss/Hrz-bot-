const baltopCommand = {
    name: 'baltop',
    alias: ['topcol', 'topcoins', 'topmonedas', 'leaderboard'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command }) => {
        let page = parseInt(args[0]);
        if (isNaN(page) || page < 1) page = 1;

        const limit = 10;
        const skip = (page - 1) * limit;

        const totalUsers = await global.User.countDocuments({ col: { $gt: 0 } });
        const totalPages = Math.ceil(totalUsers / limit) || 1;

        if (page > totalPages) {
            return m.reply(`❌ La página ${page} no existe. Solo hay ${totalPages} página(s).`);
        }

        const users = await global.User.find({ col: { $gt: 0 } }).sort({ col: -1 }).skip(skip).limit(limit).lean();

        let txt = `\n\t\t\t\t♛  *TOP GLOBAL FINANCIERO* ♛\n\n`;
        txt += `◈ *PÁGINA:* ${page}/${totalPages}\n`;
        txt += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;

        let mentions = [];

        if (users.length === 0) {
            txt += `┃ ✦ No hay datos suficientes.    ┃\n`;
        } else {
            users.forEach((user, index) => {
                const rank = skip + index + 1;
                let medal = '🏅';
                if (rank === 1) medal = '🥇';
                if (rank === 2) medal = '🥈';
                if (rank === 3) medal = '🥉';

                const userId = user.id.split('@')[0];
                mentions.push(user.id);
                const colFormated = (user.col || 0).toLocaleString('en-US');

                txt += `┃ ${medal} *#${rank}* ┃ @${userId}\n`;
                txt += `┃ ✧ *Fondos:* ${colFormated} Col\n`;
                
                if (index < users.length - 1) {
                    txt += `┣━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
                }
            });
        }

        txt += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
        
        if (page < totalPages) {
            txt += `\n✦ _Usa ${usedPrefix + command} ${page + 1} para ver la siguiente página._`;
        }

        await conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m });
        await m.react("🏆");
    }
};

export default baltopCommand;
