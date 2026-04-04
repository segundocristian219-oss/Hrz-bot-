export default {
    name: 'stats',
    alias: ['topcmd', 'uso'],
    category: 'main',
    run: async (m, { conn, text }) => {
        try {
            
            if (text) {
                const targetCmd = text.toLowerCase().trim();
                const stats = await global.Stats.findOne({ command: targetCmd }).lean();

                if (!stats) return m.reply(`> ╰❒ El comando *"${targetCmd}"* aún no tiene registros de uso.`);

                const groupKey = m.chat.replace(/\./g, '_');
                const usageInGroup = stats.groups ? (stats.groups[groupKey] || 0) : 0;

                let detail = `📊 *DETALLES: ${targetCmd.toUpperCase()}*\n\n`;
                detail += `🌎 *Uso Global:* ${stats.globalUsage}\n`;
                detail += `📍 *Uso en este grupo:* ${usageInGroup}`;
                
                return await conn.reply(m.chat, detail, m);
            }

            // Caso 2: .uso (Top 5)
            const allStats = await global.Stats.find().lean();
            if (!allStats.length) return m.reply("> ╰❒ Sin datos registrados.");

            const topGlobal = [...allStats]
                .sort((a, b) => b.globalUsage - a.globalUsage)
                .slice(0, 5);

            const groupKey = m.chat.replace(/\./g, '_');
            const topLocal = [...allStats]
                .filter(s => s.groups && s.groups[groupKey])
                .sort((a, b) => (b.groups[groupKey] || 0) - (a.groups[groupKey] || 0))
                .slice(0, 5);

            let txt = `📊 *MÉTRICAS DE SISTEMA*\n\n`;
            txt += `🌎 *TOP 5 GLOBAL:*\n`;
            topGlobal.forEach((s, i) => {
                txt += `${i + 1}. ${s.command} → ${s.globalUsage}\n`;
            });

            if (m.isGroup) {
                txt += `\n📍 *TOP 5 GRUPO:*\n`;
                if (topLocal.length > 0) {
                    topLocal.forEach((s, i) => {
                        txt += `${i + 1}. ${s.command} → ${s.groups[groupKey]}\n`;
                    });
                } else {
                    txt += `_Sin actividad registrada en este grupo._\n`;
                }
            }

            txt += `\n💡 _Usa *${global.prefix}uso [comando]* para ver detalles específicos._`;

            await conn.reply(m.chat, txt, m);
        } catch (e) {
            console.error(e);
            m.reply("> ❌ Error al procesar las estadísticas.");
        }
    }
};
