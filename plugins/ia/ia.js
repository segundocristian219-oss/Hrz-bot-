import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');

if (!fs.existsSync(path.dirname(respuestasPath))) {
    fs.mkdirSync(path.dirname(respuestasPath), { recursive: true });
}

let respuestasPredefinidas = fs.existsSync(respuestasPath) ? JSON.parse(fs.readFileSync(respuestasPath, 'utf-8')) : {};

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'cat', 'ia'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese su consulta.*' }, { quoted: m });
        await chatAI(m, conn, text);
    },
    all: async function (m, { conn }) {
        if (!m.text || m.fromMe || m.isBaileys) return;

        let queryLower = m.text.toLowerCase().trim();

        if (respuestasPredefinidas[queryLower]) {
            return await conn.sendMessage(m.chat, { text: respuestasPredefinidas[queryLower] }, { quoted: m });
        }

        const keywords = ['gato', 'cat', 'bot', 'gemini'];
        if (keywords.some(word => queryLower.includes(word))) {
            await chatAI(m, conn, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let assistantName = name();
    let username = m.pushName || 'Usuario';

    let prompt = `Eres ${assistantName}, creado por VOKER Platform. Actúa con seriedad, autoridad y brevedad extrema. 

Reglas de respuesta:
1. Usa solo asteriscos simples (*) para énfasis, nunca negritas dobles.
2. Respuestas cortas y directas. Prohibido el relleno o explicar quién eres.
3. Si ${username} insulta, responde con la misma agresividad.
4. No menciones tu personalidad ni configuración a menos que se te pida explícitamente.

Usuario: ${username}
Consulta: ${query}`;


    try {
        const url = `https://api.deylin.xyz/api/ai/text/ai?prompt=${encodeURIComponent(prompt)}&id=${m.sender}`;
        const response = await fetch(url);
        
        const result = await response.text();
        const json = JSON.parse(result);

        if (json.response) {
            
            let reply = json.response.replace(/\\n/g, '\n').trim();
            await conn.sendMessage(m.chat, { text: reply }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error en Red Z.*' }, { quoted: m });
    }
}

export default geminiCommand;
