import axios from 'axios';

const geminiCommand = {
    name: 'gemini',
    alias: ['bot'],
    category: 'ai',
    async function chatAI(m, conn, query) {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    // Mostramos que el bot está trabajando (da profesionalismo)
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    let body = {
        id: m.sender,
        prompt: query.trim() || "Analiza esto",
        fileBase64: null,
        mimeType: null
    };

    if (mime && /image|video|audio/.test(mime)) {
        try {
            let media = await q.download();
            if (media) {
                // Si el archivo es muy grande, Vercel fallará. Limitamos a 8MB.
                if (media.length > 8 * 1024 * 1024) return m.reply("❌ El archivo es demasiado pesado para la IA.");
                body.fileBase64 = media.toString('base64');
                body.mimeType = mime;
            }
        } catch (e) { console.error("Error media:", e); }
    }

    try {
        const response = await axios.post(`https://api.deylin.xyz/api/ai/text/ai`, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 40000 // Aumentamos a 40 segundos para Tavily + Gemini
        });

        const data = response.data;

        if (data.image) {
            await conn.sendMessage(m.chat, { 
                image: { url: data.image }, 
                caption: data.response
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: data.response }, { quoted: m });
        }
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("DEBUG ERROR:", err.response?.data || err.message);
        
        // El bot ahora te dirá la verdad del error
        let msgError = "*[ ❌ ] Error en el Suministro*";
        if (err.code === 'ECONNABORTED') msgError = "*[ ❌ ] Tiempo agotado (El servidor tardó mucho).*";
        if (err.response?.status === 500) msgError = "*[ ❌ ] Error Interno del Servidor (Revisa logs de Vercel).*";
        if (err.response?.status === 404) msgError = "*[ ❌ ] No se encontró la ruta de la API.*";

        await conn.sendMessage(m.chat, { text: msgError }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    }
}

export default geminiCommand;
