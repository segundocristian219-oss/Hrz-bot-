import fetch from "node-fetch";

const copilotCommand = {
    name: 'copilot',
    alias: ['copilot', 'microsoft'],
    category: 'ai',
    col: 5,
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! Soy Copilot, ¿en qué puedo ayudarte?' }, { quoted: m });

        await m.react('⏳');
        try {
            const userId = m.sender.split('@')[0];
            const url = `https://api.dix.lat/copilot?text=${encodeURIComponent(text)}&id=${userId}`;

            const res = await fetch(url);
            const json = await res.json();

            if (!json.status || !json.response) {
                throw new Error("Respuesta inválida de Copilot");
            }

            await m.react('✅');

            await conn.sendMessage(m.chat, { text: json.response }, { quoted: m });

        } catch (e) {
            console.error(e);
            await m.react('❌');
            await conn.sendMessage(m.chat, { text: '⚠️ Error al conectar con la API de Copilot.' }, { quoted: m });
        }
    }
};

export default copilotCommand;