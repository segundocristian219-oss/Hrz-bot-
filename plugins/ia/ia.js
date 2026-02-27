import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');
if (!fs.existsSync(path.dirname(respuestasPath))) fs.mkdirSync(path.dirname(respuestasPath), { recursive: true });
let respuestasPredefinidas = fs.existsSync(respuestasPath) ? JSON.parse(fs.readFileSync(respuestasPath, 'utf-8')) : {};

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'cat', 'ia'],
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
    let username = m.pushName || 'Usuario';
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    let body = {
        id: m.sender,
        prompt: query || 'Analiza esto',
        fileBase64: null,
        mimeType: null
    };

    if (/image|video|audio|pdf|text/.test(mime)) {
        let media = await q.download();
        body.fileBase64 = media.toString('base64');
        body.mimeType = mime;
    }

    try {
        const url = `https://api.deylin.xyz/api/ai/text/ai`; 
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const json = await response.json();

        if (json.response) {
            let reply = json.response.replace(/\*\*/g, '*').trim();
            await conn.sendMessage(m.chat, { text: reply }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error de conexión.*' }, { quoted: m });
    }
}

export default geminiCommand;
