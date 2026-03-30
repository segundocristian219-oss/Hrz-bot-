import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

const uploadToVokerApi = async (input) => {
    try {
        const isUrl = typeof input === 'string' && input.startsWith('http');
        const endpoint = 'https://api.dix.lat/upload/tmp';

        
        if (isUrl) {
            const res = await fetch(`${endpoint}?url=${encodeURIComponent(input)}`);
            return await res.json();
        }

        const type = await fileTypeFromBuffer(input);
        const formData = new FormData();
        const blob = new Blob([input], { type: type?.mime || 'application/octet-stream' });
        
        formData.append('file', blob, `voker_${Date.now()}.${type?.ext || 'bin'}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: { 'User-Agent': 'Voker-Client/1.0' }
        });

        return await response.json();
    } catch (e) {
        console.error('Upload Error:', e);
        return { status: false, error: e.message };
    }
};

const tourl3Command = {
    name: 'tourl3',
    alias: ['tmp'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let target = null;

            
            if (text && text.match(/https?:\/\/[^\s]+/gi)) {
                target = text.trim();
            } 
            
            else if (mime) {
                target = await q.download();
            } 
            else {
                return m.reply('> ✎ Responde a un archivo o pega una URL directa.');
            }

            await m.react('🕓');

            const result = await uploadToVokerApi(target);

            if (!result || !result.status) {
                await m.react('✖️');
                return m.reply(`> ⚔ *Error:* ${result?.error || 'No se pudo procesar el archivo.'}`);
            }

            let txt = `> ☁️ *VOKER TEMPORARY STORAGE*\n\n`;
            txt += `> 🔗 *URL:* ${result.url}\n`;
            txt += `> ⚖ *Peso:* ${result.size}\n`;
            txt += `> 📄 *Tipo:* ${result.format.toUpperCase()}\n`;
            txt += `> 🆔 *ID:* \`${result.id}\`\n\n`;
            txt += `> _Expira en 24 horas automáticamente._`;

            await m.reply(txt);
            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ☣️ *Critical Error:* ${e.message}`);
        }
    }
};

export default tourl3Command;
