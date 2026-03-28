export default {
    name: 'stats',
    alias: ['topcmd', 'uso'],
    category: 'main',
    run: async (m, { conn }) => {
        try {
            const allStats = await global.Stats.find().lean();
            if (!allStats.length) return m.reply("> ╰❒ Sin datos registrados.");

            const topGlobal = [...allStats]
                .sort((a, b) => b.globalUsage - a.globalUsage)
                .slice(0, 5);

            const groupKey = m.chat.replace(/\./g, '_');
            const topLocal = [...allStats]
                .filter(s => s.groups && s.groups[groupKey])
                .sort((a, b) => b.groups[groupKey] - a.groups[groupKey])
                .slice(0, 5);

            let txt = `📊 *MÉTRICAS DE SISTEMA*\n\n`;
            txt += `🌎 *TOP GLOBAL:*\n`;
            topGlobal.forEach((s, i) => {
                txt += `${i + 1}. ${s.command} → ${s.globalUsage}\n`;
            });

            if (m.isGroup) {
                txt += `\n📍 *TOP GRUPO:*\n`;
                if (topLocal.length > 0) {
                    topLocal.forEach((s, i) => {
                        txt += `${i + 1}. ${s.command} → ${s.groups[groupKey]}\n`;
                    });
                } else {
                    txt += `_Sin actividad registrada._\n`;
                }
            }

            await conn.reply(m.chat, txt, m);
        } catch (e) {
            console.error(e);
        }
    }
};