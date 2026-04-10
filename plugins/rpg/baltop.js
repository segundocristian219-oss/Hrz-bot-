const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const baltopCommand = {
    name: 'baltop',
    alias: ['topcol', 'topbal'],
    category: 'economy',
    run: async (m, { conn }) => {
        const users = await global.User.find().lean();
        
        const sortedUsers = users
            .map(user => ({
                id: user.id,
                total: (user.col || 0) + (user.bank || 0)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        let topTxt = "『 RANKING DE RIQUEZA TOTAL 』\n\n";
        topTxt += `✦ Top: 6 Global\n`;
        topTxt += `──────────────────\n\n`;
        
        if (sortedUsers.length === 0) {
            topTxt += "◈ No hay registros disponibles.\n";
        } else {
            for (let i = 0; i < sortedUsers.length; i++) {
                const u = sortedUsers[i];
                let name = await conn.getName(u.id);
                if (!name) name = "Usuario";
                
                topTxt += `[ ${i + 1} ] ── ${name.toUpperCase().substring(0, 20)}\n`;
                topTxt += `◈ Capital: ${formatCol(u.total)} Col\n`;
                topTxt += `──────────────────\n\n`;
            }
        }

        await conn.sendMessage(m.chat, { text: topTxt.trim() }, { quoted: m });
    }
};

export default baltopCommand;
