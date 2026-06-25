import { WebSocket } from 'ws';

const HEADERS = {
    'origin': 'https://copilot.microsoft.com',
    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
    'content-type': 'application/json'
};

async function createConversation() {
    const res = await fetch('https://copilot.microsoft.com/c/api/conversations', {
        method: 'POST',
        headers: HEADERS
    });
    if (!res.ok) throw new Error(`Error creando conversación: ${res.status}`);
    const data = await res.json();
    return data.id;
}

export async function scrapeCopilot(task) {
    const { prompt, history = [] } = task;
    const conversationId = await createConversation();

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, {
            headers: HEADERS
        });

        let responseText = '';
        const foundMedia = [];

        const timer = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
            reject(new Error('Timeout'));
        }, 50000);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                event: 'setOptions',
                supportedFeatures: ['partial-generated-images', 'generated-images', 'visual-search'],
                supportedCards: ['image', 'main', 'video', 'search-result'],
                ads: { supportedTypes: ['text'] }
            }));

            const systemInstruction = `Actúa como un asistente minimalista para WhatsApp.
Reglas de formato:
1. Usa ÚNICAMENTE un asterisco para negritas (*texto*). NUNCA uses doble asterisco (**).
2. Usa guiones bajos para cursivas (_texto_).
3. No uses encabezados estilo Markdown (#, ##, ###).
4. No uses listas con viñetas de círculo; usa guiones (-) o emojis pequeños.
5. Prohibido dar introducciones como "Aquí tienes la info" o "Claro, yo te ayudo". Responde DIRECTAMENTE a la petición.
6. Mantén el texto limpio, sin ruido visual técnico.`;

            const context = history.map(h => `User: ${h.q}\nAI: ${h.a}`).join('\n');
            const fullPrompt = `${systemInstruction}\n\n${context}\nUser: ${prompt}`;

            ws.send(JSON.stringify({
                event: 'send',
                mode: 'chat',
                conversationId,
                content: [{ type: 'text', text: fullPrompt }],
                context: {}
            }));
        });

        ws.on('message', (chunk) => {
            try {
                const parsed = JSON.parse(chunk.toString());
                if (parsed.event === 'appendText') responseText += parsed.text || '';
                if (parsed.event === 'card') {
                    if (parsed.card?.type === 'image') parsed.card.images?.forEach(img => { if (img.image?.url) foundMedia.push({ type: 'image', url: img.image.url }); });
                    if (parsed.card?.type === 'video') parsed.card.videos?.forEach(vid => { if (vid.source?.url) foundMedia.push({ type: 'video', url: vid.source.url }); });
                }
                if (parsed.event === 'upsertImageUrl') foundMedia.push({ type: 'image', url: parsed.url });
                if (parsed.event === 'done') {
                    clearTimeout(timer);
                    ws.close();
                    resolve({ text: responseText.trim(), media: foundMedia });
                }
            } catch (_) {}
        });

        ws.on('error', (err) => { clearTimeout(timer); reject(err); });
    });
}