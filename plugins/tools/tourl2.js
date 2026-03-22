import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

const uploadToDeylinApi = async (buffer, fileName, mime) => {
    try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mime });
        formData.append('file', blob, fileName);

        const response = await fetch('https://api.dix.lat/upload2', {
            method: 'POST',
            body: formData,
            headers: { 'User-Agent': 'Drive-Client' }
        });

        const json = await response.json();
        return (json.status && json.data) ? json.data : null;
    } catch (e) {
        return null;
    }
};

const gitUploadCommand = {
    name: 'dix',
    alias: ['tourl2'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';

            if (!mime) return m.reply('> ✎ Responde a un archivo.');

            await m.react('🕓');

            let buffer = await q.download();
            if (!buffer) return m.reply('> ⚔ Error al obtener buffer.');

            const type = await fileTypeFromBuffer(buffer);
            const fileName = `file_${Date.now()}.${type?.ext || 'bin'}`;

            const result = await uploadToDeylinApi(buffer, fileName, mime);

            if (!result || !result.url) {
                await m.react('✖️');
                return m.reply('> ⚔ Error al subir a la API.');
            }

            let txt = `> 🚀 *DIX.LAT DRIVE UPLOAD*\n\n`;
            txt += `> ⚖ *Peso:* ${result.size}\n`;
            txt += `> ✧ *Mime:* ${result.mime || mime}\n`;
            txt += `> 🔗 *URL:* ${result.url}\n\n`;
            txt += `> _Archivo procesado correctamente._`;

            await m.reply(txt);
            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ Error: ${e.message}`);
        }
    }
};

export default gitUploadCommand;
