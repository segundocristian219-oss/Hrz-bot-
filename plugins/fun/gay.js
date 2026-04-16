const gayCommand = {
    name: 'gay',
    alias: ['marica', 'trolo'],
    category: 'fun',
    run: async (m, { conn }) => {
        const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
        const percent = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
        const userNumber = who.split('@')[0];
        
        const styles = [
            `🚀 *RESULTADOS DE LA NASA* 🚀\n\nAnalizando a: @${userNumber}\n\nLos satélites confirman un *${percent}%* de tendencia Gay.\n\n¡El universo no miente! 🏳️‍🌈`,
            `📊 *ESTADÍSTICAS GLOBALES* 📊\n\nIdentidad confirmada: @${userNumber}\n\nEl mundo ha votado y el veredicto es un imbatible *${percent}%*.\n\n¡Es oficial, no hay duda! 🌈`,
            `⚖️ *EL GAYÓMETRO INVISIBLE* ⚖️\n\nEscaneando a: @${userNumber}\n\n*RESULTADO:* ${percent}%\n*NIVEL:* Altamente sospechoso.\n\n🏳️‍🌈 ¡Miren a este Gay! 🏳️‍🌈`,
            `🧬 *ANÁLISIS DE ADN* 🧬\n\nSujeto: @${userNumber}\n\nSe ha detectado el gen arcoíris activado al *${percent}%*.\n\n¡La ciencia lo confirma! 🏳️‍🌈`
        ];

        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        try {
            let avatarUrl;
            try {
                avatarUrl = await conn.profilePictureUrl(who, 'image');
            } catch {
                const label = encodeURIComponent(`ID: ${userNumber}`);
                avatarUrl = `https://lucide-api.vercel.app/api/avatar?text=${label}&bg=2c3e50&clr=ffffff&size=500`;
            }

            const processedImageUrl = `https://some-random-api.com/canvas/overlay/gay?avatar=${encodeURIComponent(avatarUrl)}`;

            await conn.sendMessage(m.chat, {
                image: { url: processedImageUrl },
                caption: selectedStyle,
                mentions: [who]
            }, { quoted: m });

        } catch (error) {
            await conn.sendMessage(m.chat, { 
                text: `🌈 *GAYÓMETRO*\n\nIdentificado: @${userNumber}\nResultado: *${percent}%* Gay.`, 
                mentions: [who] 
            }, { quoted: m });
        }
    }
};

export default gayCommand;
