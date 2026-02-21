import axios from 'axios';

const novaCommand = {
    name: 'nova',
    alias: ['ia', 'catia'],
    category: 'ia',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply(`> *✎ Hola, soy CAT-BOT IA. ¿En qué puedo ayudarte hoy?*`);

        await m.react('💬');

        try {
            
            const name = m.pushName || global.db.data?.users[m.sender]?.name || 'Usuario';

            const payload = {
                model: "nova-2-lite-v1",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres CAT-BOT, un asistente avanzado creado por Deylin. Estás hablando con ${name}.` 
                    },
                    { role: "user", content: text }
                ]
            };

            const { data } = await axios.post('https://api.nova.amazon.com/v1/chat/completions', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 3f7f5a1f-36df-44b0-ac47-eb5554fe022c`
                }
            });

            if (data && data.choices && data.choices[0].message) {
                const response = data.choices[0].message.content;
                await m.reply(response);
                await m.react('✅');
            } else {
                throw new Error('Estructura de respuesta inválida');
            }

        } catch (e) {
            console.error('Error en Nova IA:', e.response ? e.response.data : e.message);
            await m.react('✖️');
            m.reply(`> *⚠ Error en el servidor de Amazon Nova. Intenta más tarde.*`);
        }
    }
};

export default novaCommand;
