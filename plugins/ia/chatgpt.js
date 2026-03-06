import fetch from "node-fetch";

const chatgptCommand = {
    name: 'chatgpt',
    alias: ['ia', 'gpt', 'chatgpt'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! ¿En qué puedo ayudarte hoy?' }, { quoted: m });

        await m.react('⏳');
        try {
            const url = `${global.url_api}/chat?q=${encodeURIComponent(text)}&apikey=${apikey}`;
            const res = await fetch(url);
            const json = await res.json();

            
            if (!json.success || !json.data || !json.data.content) {
                throw new Error("Estructura de API inválida");
            }

            await m.react('✅');
            
            
            await conn.sendMessage(m.chat, { text: json.data.content }, { quoted: m });

        } catch (e) {
            console.error(e);
            await m.react('❌');
            await conn.sendMessage(m.chat, { text: '⚠️ Error al conectar con ChatGPT.' }, { quoted: m });
        }
    }
};

export default chatgptCommand;
