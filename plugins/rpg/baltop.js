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
                name: user.name,
                total: (user.col || 0) + (user.bank || 0)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        let topTxt = "『 ✦ TOP 6 CON MAS BALANCE ✦ 』\n\n";
        topTxt += "◈ Registro Global de Riqueza\n";
        topTxt += "──────────────────\n\n";
        
        if (sortedUsers.length === 0) {
            topTxt += "◈ No se encontraron registros en el sistema.\n";
        } else {
            for (let i = 0; i < sortedUsers.length; i++) {
                const u = sortedUsers[i];
                let name = u.name || await conn.getName(u.id);
                
                if (!name || name.trim() === '') {
                    name = "Desconocido";
                }

                const position = i + 1;
                
                topTxt += `[ 0${position} ] ── ${name.toUpperCase().substring(0, 25)}\n`;
                topTxt += `◈ Col: ${formatCol(u.total)} Col\n`;
                topTxt += "──────────────────\n\n";
            }
        }

        topTxt += "✦ Los datos se actualizan en tiempo real";

        await conn.sendMessage(m.chat, { text: topTxt.trim() }, { quoted: m });
    }
};

export default baltopCommand;
