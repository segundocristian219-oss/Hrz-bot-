import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: 'https://api.nova.amazon.com/v1',
    apiKey: '273303eb-65c5-40c4-b708-df34d3af61e4'
});

const novaCommand = {
    name: 'nova',
    alias: ['novaai'],
    category: 'ia',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply(`> *✎ Hola, ¿en qué puedo ayudarte hoy?*`);

        await m.react('💬');

        try {
            
            const name = m.pushName || global.db.data?.users[m.sender]?.name || 'Usuario';

            const completion = await openai.chat.completions.create({
                model: "amazon.nova-lite-v1.0", 
                messages: [
                    { role: "system", content: `Eres un asistente útil. Estás hablando con ${name}.` },
                    { role: "user", content: text }
                ],
            });

            const response = completion.choices[0].message.content;
            
            await m.reply(response);
            await m.react('✅');

        } catch (e) {
            console.error('Error en Nova IA:', e);
            await m.react('✖️');
            
            m.reply(`> *⚠ Hubo un error al conectar con la IA.*`);
        }
    }
};

export default novaCommand;
