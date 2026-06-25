import fetch from "node-fetch";

export const chatgptCommand = {
    category: 'ai',
    commands: {
        chatgpt: {
            name: 'chatgpt',
            alias: ['ia', 'gpt', 'chatgpt'],
            run: async (m, { conn, text }) => {
                if (!text) {
                    return await conn.sendMessage(m.chat, { 
                        text: `> ⌗ Hola, ¿En qué puedo ayudarte hoy?` 
                    }, { quoted: m });
                }

                await m.react('⏳');
                try {
                    const response = await fetch('https://panel.apinexus.fun/api/ia/gpt-120b', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'x-api-key': key
                        },
                        body: JSON.stringify({ mensaje: text })
                    });

                    const json = await response.json();

                    if (!json.success || !json.data || !json.data.respuesta) {
                        throw new Error("Respuesta inválida");
                    }

                    await m.react('✅');
                    await conn.sendMessage(m.chat, { 
                        text: ` ${json.data.respuesta}`,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                    await conn.sendMessage(m.chat, { 
                        text: `> ⚔ ERROR: No se pudo conectar con el núcleo GPT-120B.` 
                    }, { quoted: m });
                }
            }
        }
    }
};
