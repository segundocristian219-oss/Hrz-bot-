import mongoose from 'mongoose';

const news = {
    name: 'novedades',
    alias: ['news', 'updates', 'whatsnew'],
    category: 'info',
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            const data = await global.News.find().sort({ date: -1 }).limit(5);

            if (!data || data.length === 0) {
                return await conn.sendMessage(m.chat, { text: '➠ *NOVEDADES*\n\n⍰ No hay actualizaciones registradas actualmente.' }, { quoted: m });
            }

            let report = `➠ _Últimas mejoras y correcciones_\n\n`;

            data.forEach((n, i) => {
                const date = new Date(n.date).toLocaleDateString('es-HN');
                report += `*${i + 1}. ${n.title.toUpperCase()}*\n`;
                report += `* ✎: ${n.description}\n`;
                if (n.command) report += `* ✰: *Comando:* \`${n.command}\`\n`;
                report += `* ᰔᩚ: *Fecha:* ${date}\n\n`;
            });

            report += ``;

            await conn.sendMessage(m.chat, {
                text: report,
                contextInfo: {
                    externalAdReply: {
                        title: m.name,
                        body: `Novedades`,
                        mediaType: 1,
                        thumbnailUrl: m.img,
                        sourceUrl: 'https://dix.lat',
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            await conn.sendMessage(m.chat, { text: '┃ *ERROR*\n\n⍰ Fallo al consultar la base de datos.' }, { quoted: m });
        }
    }
};

export default news;