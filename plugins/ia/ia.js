import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');
if (!fs.existsSync(path.dirname(respuestasPath))) fs.mkdirSync(path.dirname(respuestasPath), { recursive: true });
let respuestasPredefinidas = fs.existsSync(respuestasPath) ? JSON.parse(fs.readFileSync(respuestasPath, 'utf-8')) : {};

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'cat'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        await chatAI(m, conn, text || '');
    },
    all: async function (m, { conn }) {
        if (!m.text || m.fromMe || m.isBaileys) return;
        let queryLower = m.text.toLowerCase().trim();
        if (respuestasPredefinidas[queryLower]) {
            return await conn.sendMessage(m.chat, { text: respuestasPredefinidas[queryLower] }, { quoted: m });
        }
        const keywords = ['gato', 'cat', 'bot', 'gemini'];
        if (keywords.some(word => queryLower.includes(word)) && !m.isGroup) {
            await chatAI(m, conn, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || (q.mediaMessage?.imageMessage?.mimetype) || (q.mediaMessage?.videoMessage?.mimetype) || (q.mediaMessage?.audioMessage?.mimetype) || (q.mediaMessage?.documentMessage?.mimetype) || '';
    
    let finalPrompt = query.trim() || "Analiza este archivo detalladamente";

    let body = {
        id: m.sender,
        prompt: finalPrompt,
        fileBase64: null,
        mimeType: null
    };

    if (mime && /image|video|audio|pdf|text/.test(mime)) {
        try {
            let media = await q.download();
            if (media) {
                body.fileBase64 = media.toString('base64');
                body.mimeType = mime;
            }
        } catch (e) {
            console.error("Error al descargar media:", e);
        }
    }

    try {
        const url = `https://api.deylin.xyz/api/ai/text/ai`; 
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const json = await response.json();

        if (json.response) {
            let reply = json.response.replace(/\*\*/g, '*').trim();
            await conn.sendMessage(m.chat, { text: reply }, { quoted: m });
        }
    } catch (err) {
        console.error("Error en chatAI:", err);
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error de comunicación con la API.*' }, { quoted: m });
    }
}

export default geminiCommand;
