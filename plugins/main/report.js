import axios from 'axios';

const replyReportCommand = {
    name: 'responder',
    alias: ['reply', 'rta', 'r'],
    category: 'owner',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        if (!owners.includes(m.sender)) return;

        if (!m.quoted) return m.reply('⚠ Error: Debes etiquetar el mensaje del reporte para responder.');

        const quotedContent = m.quoted.text || m.quoted.caption || '';
        if (!quotedContent.includes('⬡ NUEVO REPORTE RECIBIDO')) {
            return m.reply('⚠ Error: El mensaje etiquetado no es un reporte valido.');
        }

        try {
            const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
            const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];

            if (!userJid || !chatId) return m.reply('⚠ Error: No se pudo extraer la informacion del reporte.');

            let q = m;
            let mime = (q.msg || q).mimetype || '';
            let isGroup = chatId.endsWith('@g.us');
            
            let content = { mentions: isGroup ? [userJid] : [] };
            const header = '⌬ RESPUESTA DEL DESARROLLADOR\n\n';
            const body = text || '';

            if (/image/.test(mime)) {
                content.image = await q.download();
                content.caption = header + body;
            } else if (/video/.test(mime)) {
                content.video = await q.download();
                content.caption = header + body;
            } else if (/audio/.test(mime)) {
                content.audio = await q.download();
                content.mimetype = 'audio/mp4';
                content.ptt = true;
            } else {
                if (!text) return m.reply('⚠ Error: Escribe un mensaje para responder.');
                content.text = header + body;
            }

            await conn.sendMessage(chatId, content);
            await m.reply('✓ Respuesta enviada con exito al destino original.');

        } catch (e) {
            console.error(e);
            await m.reply('☒ Error al procesar el envio de la respuesta.');
        }
    }
};

export default replyReportCommand;
