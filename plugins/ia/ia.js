import fetch from 'node-fetch';

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'cat'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!text && !mime) {
            return await conn.sendMessage(m.chat, { 
                text: `> *✎ Hola, soy Gato Bot. ¿En qué puedo ayudarte hoy?*\n\n*Puedes enviarme:* \n*• Texto:* Consultas de cualquier tipo.\n*• Imágenes/Video:* Para que los analice.\n*• Audio:* Para transcribir o resumir.` 
            }, { quoted: m });
        }

        await chatAI(m, conn, text || '');
    },
    all: async function (m, { conn }) {
        if (!m.text || m.fromMe || m.isBaileys) return;
        
        let queryLower = m.text.toLowerCase().trim();
        const keywords = ['gato', 'cat', 'bot', 'gemini'];
        
        
        if (keywords.some(word => queryLower.includes(word)) && !m.isGroup) {
            await chatAI(m, conn, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    
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
        // Conexión directa a tu API en Vercel
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
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error de comunicación con la API de VOKER.*' }, { quoted: m });
    }
}

export default geminiCommand;
