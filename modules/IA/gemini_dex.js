import { dispatchMediaTask } from '../../src/workers/workerPool.js';

const sessions = new Map();

export const geminiCommand = {
    category: 'ai',
    commands: {
        gemini: {
            name: 'gemini',
            alias: ['dex', 'ia'],
            run: async (m, { conn, text }) => {
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';
                const prompt = text?.trim();
                const isMedia = mime && /image|video|audio|pdf|text/.test(mime);

                if (!prompt && !isMedia) return conn.sendMessage(m.chat, { text: `> ⌗ Hola, soy GEMINI-DEX. ¿En qué puedo ayudarte hoy?` }, { quoted: m });

                await m.react('✨');
                try {
                    const userId = m.sender;
                    let finalResponse = '';

                    if (prompt && /(haz|genera|dibuja|pinta|imagine)/i.test(prompt.toLowerCase())) {
                        try {
                            const { url } = await dispatchMediaTask({ type: 'generate_image', prompt });
                            await m.react('🖼️');
                            return conn.sendMessage(m.chat, { image: { url }, caption: `> IMAGEN GENERADA`, contextInfo: { ...global.channelInfo } }, { quoted: m });
                        } catch (_) {}
                    }

                    if (isMedia) {
                        const media = await q.download();
                        if (!media) throw new Error('No se pudo descargar el archivo adjunto.');
                        const fechaTexto = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        const payload = {
                            contents: [
                                { role: 'user', parts: [{ text: `Hoy es ${fechaTexto}. Eres GEMINI-DEX, una IA desarrollada por Deylin. Responde de forma concisa y amigable usando formato de WhatsApp.` }] },
                                { role: 'model', parts: [{ text: 'Entendido.' }] },
                                { role: 'user', parts: [{ text: prompt || 'Analiza este archivo' }, { inline_data: { mime_type: mime, data: media.toString('base64') } }] }
                            ]
                        };
                        const { text: t } = await dispatchMediaTask({ type: 'scrape_gemini_api', payload });
                        finalResponse = t;
                    } else {
                        const sessionData = sessions.get(userId) || { id: null };
                        const { text: t, id } = await dispatchMediaTask({ type: 'scrape_gemini', prompt, previousId: sessionData.id });
                        sessions.set(userId, { id });
                        finalResponse = t;
                    }

                    await m.react('📚');
                    await conn.sendMessage(m.chat, { text: `> GEMINI-DEX\n\n ${finalResponse.replace(/\*\*/g, '*')}`, contextInfo: { ...global.channelInfo } }, { quoted: m });
                } catch (err) {
                    console.error(err);
                    await m.react('🚫');
                    conn.sendMessage(m.chat, { text: `> ⚔ ERROR: ${err.message}` }, { quoted: m });
                }
            }
        }
    }
};
