import fetch from "node-fetch";

export const mistralCommand = {
    category: 'ai',
    commands: {
        mistral: {
            name: 'mistral',
            alias: ['mstrl', 'ia2', 'chat'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! Escribe algo para procesar con Mistral.' }, { quoted: m });

                await m.react('⏳');

                const apiKey = "QgjJxzvBHFUWGTTdoj8j7flMHrQzWrbg";
                const url = "https://api.mistral.ai/v1/chat/completions";

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            model: "mistral-small-latest",
                            messages: [
                                {
                                    role: "user",
                                    content: text
                                }
                            ],
                            temperature: 0.7
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
