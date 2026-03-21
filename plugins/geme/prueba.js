const broadcastGroups = {
    name: 'bcgc',
    alias: ['broadcastgc', 'difundir'],
    category: 'owner',
    run: async (m, { conn, text }) => {
        // Filtro de seguridad: Solo el Owner/Dev
        // Puedes usar m.isOwner o comparar con tu número directamente
        if (!m.isOwner) return;

        if (!text) return conn.sendMessage(m.chat, { text: `⚠️ *Ingrese el texto para la difusión.*` }, { quoted: m });

        const groups = Object.keys(await conn.groupFetchAllParticipating());
        const totalGroups = groups.length;

        await conn.sendMessage(m.chat, { text: `🚀 *Iniciando difusión en ${totalGroups} grupos...*` }, { quoted: m });

        for (let i = 0; i < groups.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay de 2s para evitar ban/spam
            
            await conn.sendMessage(groups[i], {
                text: `📢 *COMUNICADO OFICIAL*\n\n${text}\n\n_Atentamente: Core Automated System_`,
                contextInfo: {
                    externalAdReply: {
                        title: "KAZUTO KIRIGAY - BROADCAST",
                        body: "Actualización de Sistema",
                        thumbnailUrl: "https://api.dix.lat/media2/1773640122670.jpg",
                        sourceUrl: "https://dix.lat/channel",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });
        }

        return conn.sendMessage(m.chat, { text: `✅ *Difusión finalizada con éxito en ${totalGroups} grupos.*` }, { quoted: m });
    }
};

export default broadcastGroups;
