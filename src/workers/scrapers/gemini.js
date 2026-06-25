const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

function btoa2(str) { return Buffer.from(str, 'utf8').toString('base64'); }
function atob2(b64) { return Buffer.from(b64, 'base64').toString('utf8'); }

function walkDeep(node, visit, depth = 0, maxDepth = 7) {
    if (depth > maxDepth) return;
    if (visit(node, depth) === false) return;
    if (Array.isArray(node)) {
        for (const x of node) walkDeep(x, visit, depth + 1, maxDepth);
    } else if (node && typeof node === 'object') {
        for (const k of Object.keys(node)) walkDeep(node[k], visit, depth + 1, maxDepth);
    }
}

function isLikelyText(s) {
    if (typeof s !== 'string') return false;
    const t = s.trim();
    if (!t || t.length < 2 || /^https?:\/\//i.test(t) || /^\/\/www\./i.test(t) || /maps\/vt\/data/i.test(t) || /^c_[0-9a-f]{6,}$/i.test(t) || (/^[A-Za-z0-9_\-+/=]{16,}$/.test(t) && !/\s/.test(t)) || /^\{.*\}$/.test(t) || /^\[.*\]$/.test(t)) return false;
    return t.length >= 8 || /\s/.test(t);
}

function pickBestTextFromAny(parsed) {
    const found = [];
    walkDeep(parsed, (n) => { if (typeof n === 'string' && isLikelyText(n)) found.push(n.trim()); });
    found.sort((a, b) => b.length - a.length);
    return found[0] || '';
}

function pickFirstString(parsed, accept) {
    let first = '';
    walkDeep(parsed, (n) => {
        if (first) return false;
        if (typeof n !== 'string') return;
        const t = n.trim();
        if (t && (!accept || accept(t))) first = t;
        if (first) return false;
    });
    return first;
}

function findInnerPayloadString(outer) {
    const candidates = [];
    const add = (s) => { if (typeof s === 'string' && s.trim()) candidates.push(s.trim()); };
    add(outer?.[0]?.[2]); add(outer?.[2]); add(outer?.[0]?.[0]?.[2]);
    walkDeep(outer, (n) => {
        if (typeof n === 'string') {
            const t = n.trim();
            if ((t.startsWith('[') || t.startsWith('{')) && t.length > 20) candidates.push(t);
        }
    }, 0, 5);
    for (const s of candidates) { try { JSON.parse(s); return s; } catch (_) {} }
    return null;
}

function parseStream(data) {
    if (typeof data !== 'string' || !data.trim()) throw new Error('Respuesta vacía');
    const chunks = Array.from(data.matchAll(/^\d+\r?\n([\s\S]+?)\r?\n(?=\d+\r?\n|$)/gm)).map(m => m[1]).reverse();
    if (!chunks.length) throw new Error('Respuesta inválida');
    let best = { text: '', resumeArray: null, parsed: null };
    for (const c of chunks) {
        try {
            const outer = JSON.parse(c);
            const inner = findInnerPayloadString(outer);
            if (!inner) continue;
            const parsed = JSON.parse(inner);
            const text = pickBestTextFromAny(parsed);
            const resumeArray = Array.isArray(parsed?.[1]) ? parsed[1] : null;
            if (!best.parsed || (text && text.length > (best.text?.length || 0))) best = { text, resumeArray, parsed };
        } catch (_) {}
    }
    if (!best.parsed) throw new Error('Error de parseo');
    let cleanText = (best.text || '').replace(/\*\*(.+?)\*\*/g, '*$1*').trim();
    if (!cleanText) {
        const accept = (t) => !/^https?:\/\/|^\/\/www\.|maps\/vt\/data/i.test(t);
        cleanText = (pickFirstString(best.parsed, accept) || pickFirstString(best.parsed)).replace(/\*\*(.+?)\*\*/g, '*$1*').trim();
    }
    return { text: cleanText, resumeArray: best.resumeArray };
}

async function getAnonCookie() {
    const r = await fetch('https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&hl=en-US&rt=c', {
        method: 'POST',
        redirect: 'manual',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA },
        body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
    });
    const setCookie = r.headers.get('set-cookie');
    if (!setCookie) throw new Error('Gemini no devolvió cookies');
    return setCookie.split(';')[0];
}

async function getXsrfToken(cookieHeader) {
    try {
        const res = await fetch('https://gemini.google.com/app', {
            method: 'GET',
            headers: { 'user-agent': UA, cookie: cookieHeader, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        });
        const html = await res.text();
        const m1 = html.match(/"SNlM0e":"([^"]+)"/);
        if (m1?.[1]) return m1[1];
        const m2 = html.match(/"at":"([^"]+)"/);
        if (m2?.[1]) return m2[1];
    } catch (_) {}
    return null;
}

export async function scrapeGemini(task) {
    const { prompt, previousId } = task;
    let resumeArray = null;
    if (previousId) { try { resumeArray = JSON.parse(atob2(previousId))?.resumeArray || null; } catch (_) {} }

    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const cookie = await getAnonCookie();
            const xsrf = await getXsrfToken(cookie);
            const payload = [[prompt.trim()], ['en-US'], resumeArray];
            const fReq = [null, JSON.stringify(payload)];
            const params = new URLSearchParams({ 'f.req': JSON.stringify(fReq) });
            if (xsrf) params.append('at', xsrf);
            const response = await fetch('https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?hl=en-US&rt=c', {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA, 'x-same-domain': '1', cookie },
                body: params,
            });
            const data = await response.text();
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const parsed = parseStream(data);
            const id = btoa2(JSON.stringify({ resumeArray: parsed.resumeArray }));
            return { text: parsed.text, id };
        } catch (e) {
            lastErr = e;
            if (attempt < 3) await new Promise(r => setTimeout(r, 700));
        }
    }
    throw new Error(lastErr.message);
}

export async function scrapeGeminiApi(task) {
    const KEYS = [
        process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Ixd32dRsGatF4cQ7Evm8w9X979iliDiVR-ch63_jdpMg',
        'AQ.Ab8RN6LJqKhPzhy1pUOyvjc0BOG5eoAdu06SzkYtZ7VQ547DFA'
    ];

    async function request(payload, keyIndex = 0) {
        if (keyIndex >= KEYS.length) throw new Error('ERR_KEYS_EXHAUSTED');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEYS[keyIndex]}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000)
        });
        if (res.status === 429 || res.status === 400) return request(payload, keyIndex + 1);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    const data = await request(task.payload);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude procesar la solicitud.';
    return { text };
}

export async function generateImage(task) {
    const setup = {
        cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
        dec(t, s) { return [...t].map(c => /[a-z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 97 - s + 26) % 26 + 97) : /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 - s + 26) % 26 + 65) : c).join(''); }
    };
    const token = setup.dec(setup.cipher, 3);
    const body = new URLSearchParams({ prompt: task.prompt, token });
    const res = await fetch('https://text2video.aritek.app/text2img', {
        method: 'POST',
        headers: { 'user-agent': 'NB Android/1.0.0', 'authorization': token, 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json?.url) throw new Error('No se generó imagen');
    return { url: json.url };
}