import axios from 'axios';

const investigarCommand = {
    name: 'investigar',
    alias: ['tavily', 'buscar', 'ia'],
    category: 'herramientas',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Necesito un tema para investigar. Ejemplo: *.investigar qué es la computación cuántica*');

        const TAVILY_API_KEY = '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';

        // Reacción visual para que el usuario sepa que el bot está "pensando"
        await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });

        try {
            const res = await axios.post('https://api.tavily.com/search', {
                api_key: TAVILY_API_KEY,
                query: text,
                search_depth: "smart", // "smart" ofrece mejores resultados que "basic"
                include_answer: true,  // Tavily genera un resumen automático
                max_results: 3
            });

            const data = res.data;
            
            // Si Tavily generó una respuesta directa (IA Answer)
            let respuesta = `🧠 *ANÁLISIS DE INTELIGENCIA*\n\n`;
            respuesta += `*Tema:* _${text}_\n\n`;
            
            if (data.answer) {
                respuesta += `📝 *Resumen:* ${data.answer}\n\n`;
            }

            respuesta += `🌐 *Fuentes Encontradas:* \n`;
            
            data.results.forEach((result, i) => {
                respuesta += `\n${i + 1}. *${result.title}*\n🔗 _${result.url}_\n`;
            });

            respuesta += `\n──────────────────\n*Suministro de Información por Deylin*`;

            await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m });

        } catch (error) {
            console.error('Error en Tavily Search:', error);
            await conn.sendMessage(m.chat, { text: "❌ Error al conectar con el motor de búsqueda." }, { quoted: m });
        }
    }
};

export default investigarCommand;
