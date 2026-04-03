import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type';

const uploadToVokerApi = async (input) => {
    try {
        const isUrl = typeof input === 'string' && input.startsWith('http');
        const endpoint = 'https://api.dix.lat/upload3';

        if (isUrl) {
            const res = await fetch(`${endpoint}?url=${encodeURIComponent(input)}`);
            return await res.json();
        }


        const type = await fileTypeFromBuffer(input);
        const base64 = `data:${type?.mime || 'application/octet-stream'};base64,${input.toString('base64')}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64 }) 
        });

        return await response.json();
    } catch (e) {
        return { status: false, error: e.message };
    }
};

const tourl3Command = {
    name: 'tourl3',
    alias: ['upload3'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let target = null;

            if (text && /https?:\/\/[^\s]+/gi.test(text)) {
                target = text.trim();
            } else if (mime) {
                target = await q.download();
            } else {
                return m.reply('> ✎ Responde a un archivo o pega una URL.');
            }

            await m.react('🕓');
            const result = await uploadToVokerApi(target);

            if (!result || !result.status) {
                await m.react('✖️');
                return m.reply(`> ⚔ *Error:* ${result?.error || 'Fallo en la API'}`);
            }

            let txt = `> ☁️ *DIX.LAT/ FILE UPLOAD*\n\n`;
            txt += `> 🔗 *URL:* ${result.url}\n`;
            txt += `> ⚖ *Peso:* ${result.size}\n`;
            txt += `> 📄 *Tipo:* ${result.format?.toUpperCase() || 'DAT'}\n`;
            txt += `> 🆔 *ID:* \`${result.id}\`\n\n`;
            txt += `> _Developed by Dix.lat._`;

            await m.reply(txt);
            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ☣️ *Error Crítico:* ${e.message}`);
        }
    }
};

export default tourl3Command;