const broadcastGroups = {
    name: 'bcgc',
    alias: ['broadcastgc', 'difundir'],
    category: 'owner',
    run: async (m, { conn, text }) => {
        if (!m.isOwner) return;

        if (!text) return conn.sendMessage(m.chat, { text: '⚠️ *Ingrese el mensaje para la difusión.*' }, { quoted: m });

        try {
            const allChats = await global.Chat.find().lean();
            const groups = allChats.filter(chat => chat._id.endsWith('@g.us')).map(chat => chat._id);
            const totalGroups = groups.length;

            if (totalGroups === 0) return conn.sendMessage(m.chat, { text: '❌ No se encontraron grupos en la base de datos.' }, { quoted: m });

            await conn.sendMessage(m.chat, { text: `🚀 *Iniciando difusión en ${totalGroups} grupos registrados...*` }, { quoted: m });

            for (const groupId of groups) {
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                await conn.sendMessage(groupId, {
                    text: `📢 *COMUNICADO OFICIAL*\n\n${text}\n\n_Atentamente: Core Automated System_`,
                    contextInfo: {
                        externalAdReply: {
                            title: "KAZUTO KIRIGAY - BROADCAST",
                            body: "Actualización de Infraestructura",
                            thumbnailUrl: "https://api.dix.lat/media2/1773640122670.jpg",
                            sourceUrl: "https://dix.lat/channel",
                            mediaType: 1,
                            showAdAttribution: true,
                            renderLargerThumbnail: true
                        }
                    }
                }).catch(err => console.error(`Error enviando a ${groupId}:`, err));
            }

            return conn.sendMessage(m.chat, { text: `✅ *Difusión finalizada con éxito en ${totalGroups} grupos.*` }, { quoted: m });

        } catch (error) {
            console.error(error);
            return conn.sendMessage(m.chat, { text: '❌ Error al acceder a MongoDB Atlas.' }, { quoted: m });
        }
    }
};

export default broadcastGroups;
