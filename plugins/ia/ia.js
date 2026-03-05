import axios from 'axios';

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'alex'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        await m.react('✨');

        if (!text && !mime) {
            return await conn.sendMessage(m.chat, { 
                text: `> *✎ Hola, soy Alex-AI. ¿En qué puedo ayudarte hoy?*` 
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
                if (media.length > 10 * 1024 * 1024) return m.reply("❌ Archivo demasiado grande (Máx 10MB).");
                body.fileBase64 = media.toString('base64');
                body.mimeType = mime;
            }
        } catch (e) { console.error(e); }
    }

    try {
        const { data } = await axios.post(`https://api.deylin.xyz/api/ai/text/ai`, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 45000 
        });

        

        if (data.image) {
         await m.react('🖼️');
            await conn.sendMessage(m.chat, { 
                image: { url: data.image }, 
                caption: data.response?.replace(/\*\*/g, '*') 
            }, { quoted: m });
        } else if (data.response) {
          await m.react('📚');
            await conn.sendMessage(m.chat, { text: data.response.replace(/\*\*/g, '*') }, { quoted: m });
        }

    } catch (err) {
        let errorDetalle = err.message;
        await m.react('🚫');
        if (err.response) {
            errorDetalle = `Status: ${err.response.status} - Data: ${JSON.stringify(err.response.data)}`;
        }
        
        console.error("DEBUG:", errorDetalle);
        
        const errorMsg = `*⚠️ ERROR TÉCNICO DETECTADO*\n\n` +
                         `*Tipo:* ${err.code || 'API_ERROR'}\n` +
                         `*Detalle:* ${errorDetalle}\n\n` +
                         `_Revisa la consola de Vercel para más información._`;

        await conn.sendMessage(m.chat, { text: errorMsg }, { quoted: m });
    }
}

export default geminiCommand;
