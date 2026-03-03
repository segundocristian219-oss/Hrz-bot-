import axios from 'axios';

const investigarCommand = {
    name: 'investigar',
    alias: ['buscar', 'ia'],
    category: 'herramientas',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Escribe qué quieres investigar.');

        const TAVILY_API_KEY = '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';

        try {
            const { data } = await axios.post('https://api.tavily.com/search', {
                api_key: TAVILY_API_KEY,
                query: text,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            let respuesta = `🧠 *INVESTIGACIÓN REALIZADA*\n\n`;
            
            if (data.answer) {
                respuesta += `📝 *Resumen:* ${data.answer}\n\n`;
            }

            if (data.results && data.results.length > 0) {
                respuesta += `🌐 *Fuentes:* \n`;
                data.results.forEach((res, i) => {
                    respuesta += `\n${i + 1}. *${res.title}*\n🔗 ${res.url}\n`;
                });
            } else if (!data.answer) {
                return m.reply("No se encontraron resultados.");
            }

            await conn.sendMessage(m.chat, { text: respuesta.trim() }, { quoted: m });

        } catch (error) {
            console.error('Tavily Error:', error.response?.data || error.message);
            m.reply("❌ Error al conectar con el servicio de búsqueda.");
        }
    }
};

export default investigarCommand;
