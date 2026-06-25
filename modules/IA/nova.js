import axios from 'axios';

export const novaCommand = {
    category: 'ia',
    commands: {
        nova: {
            name: 'nova',
            alias: ['catia'],
            run: async (m, { conn, text, user }) => {
                if (!text) return m.reply(`> *✎ Hola, ¿en qué puedo ayudarte hoy?*`);

                await m.react('💬');

                try {
                    const name2 = user?.name || m.pushName || 'Usuario';

                    const payload = {
                        model: "nova-2-lite-v1",
                        messages: [
                            { 
                                role: "system", 
                                content: `Eres ${name(conn)}, un asistente útil. Responde de forma clara. Evita usar tablas de Markdown complicadas, usa mejor listas con guiones. Estás hablando con ${name2}.` 
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

                    let response = data.choices[0].message.content;

                    response = response
                        .replace(/###\s+/g, '■ ') 
                        .replace(/##\s+/g, '▼ ')  
                        .replace(/#\s+/g, '► ')   
                        .replace(/\*\*\*/g, '*') 
                        .replace(/\*\*/g, '*')    
                        .replace(/```/g, '\n```');   

                    await m.reply(response.trim());
                    await m.react('✅');

                } catch (e) {
                    console.error('Error en Nova IA:', e.response ? JSON.stringify(e.response.data) : e.message);
                    await m.react('✖️');
                    m.reply(`> *⚠ Error al procesar la respuesta.*`);
                }
            }
        }
    }
};
