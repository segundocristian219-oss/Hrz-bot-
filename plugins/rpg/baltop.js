const formatCol = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

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

        if (page > totalPages && totalPages > 0) {
            return m.reply(`❌ La página ${page} no existe. Solo hay ${totalPages} página(s).`);
        }

        const users = await global.User.find({ col: { $gt: 0 } }).sort({ col: -1 }).skip(skip).limit(limit).lean();

        let txt = `\n\t\t\t\t♛  *LEADERBOARD GLOBAL* ♛\n\n`;
        txt += `◈ *Página:* ${page}/${totalPages}\n`;
        txt += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;

        if (users.length === 0) {
            txt += `┃ ✦ No hay datos suficientes.    ┃\n`;
        } else {
            users.forEach((user, index) => {
                const rank = skip + index + 1;
                let medal = '🏅';
                if (rank === 1) medal = '🥇';
                if (rank === 2) medal = '🥈';
                if (rank === 3) medal = '🥉';

                const userId = `+${user.id.split('@')[0]}`;
                const colStr = formatCol(user.col || 0);

                txt += `┃ ${medal} *${rank}.* ${userId} ➭ *${colStr} Col*\n`;
            });
        }

        txt += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
        
        if (page < totalPages) {
            txt += `\n✦ _Siguiente: ${usedPrefix + command} ${page + 1}_`;
        }

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
        await m.react("🏆");
    }
};

export default baltopCommand;
