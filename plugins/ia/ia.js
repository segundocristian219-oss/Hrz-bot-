import axios from 'axios';

const geminiCommand = {
    name: 'gemini',
    alias: ['bot'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (!text && !mime) {
            return await conn.sendMessage(m.chat, { 
                text: `> *✎ Hola, soy Gemini AI con Búsqueda Real. ¿En qué puedo ayudarte hoy?*` 
            }, { quoted: m });
        }

        await chatAI(m, conn, text || '');
    },
    all: async function (m, { conn }) {
        if (!m.text || m.fromMe || m.isBaileys) return;
        let queryLower = m.text.toLowerCase().trim();
        if (['bot', 'gemini'].some(word => queryLower.includes(word)) && !m.isGroup) {
            await chatAI(m, conn, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    let body = {
        id: m.sender,
        prompt: query.trim() || "Analiza esto",
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
        } catch (e) { console.error("Error descarga:", e); }
    }

    try {
        
        const { data } = await axios.post(`https://api.deylin.xyz/api/ai/text/ai`, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 
        });

        if (data.image) {
            await conn.sendMessage(m.chat, { 
                image: { url: data.image }, 
                caption: data.response?.replace(/\*\*/g, '*') 
            }, { quoted: m });
        } else if (data.response) {
            await conn.sendMessage(m.chat, { text: data.response.replace(/\*\*/g, '*') }, { quoted: m });
        } else {
            throw new Error("Respuesta vacía del servidor");
        }

    } catch (err) {
        
        console.error("DETALLE DEL ERROR:", err.response?.data || err.message);
        await conn.sendMessage(m.chat, { text: "*[ ❌ ] Error: El servidor tardó demasiado o la API Key falló.*" }, { quoted: m });
    }
}

export default geminiCommand;
