import fetch from "node-fetch";

export const chatgptCommand = {
    category: 'ai',
    commands: {
        groq: {
            name: 'groq',
            alias: ['Hrz'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! ¿En qué puedo ayudarte hoy?' }, { quoted: m });

                await m.react('⏳');

                const apiKey = "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";
                const url = "https://api.groq.com/openai/v1/chat/completions";

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messages: [
                                {
                                    role: "system",
                                    content: `Eres ${name(conn)} un asistente inteligente y útil.`
                                },
                                {
                                    role: "user",
                                    content: text
                                }
                            ],
                            model: "llama-3.1-8b-instant",
                            temperature: 0.7,
                            max_tokens: 1024,
                            top_p: 1
                        })
                    });

                    const json = await response.json();

                    if (json.error) {
                        throw new Error(json.error.message);
                    }

                    const aiResponse = json.choices[0]?.message?.content;

                    if (!aiResponse) {
                        throw new Error("No response");
                    }

                    await m.react('✅');
                    await conn.sendMessage(m.chat, { text: aiResponse.trim() }, { quoted: m });

                } catch (e) {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, { text: `⚠️ Error: ${e.message}` }, { quoted: m });
                }
            }
        }
    }
};
