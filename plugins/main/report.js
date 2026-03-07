import axios from 'axios';

const reportSystem = {
    name: 'reporte',
    alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
    category: 'main',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        const isOwner = owners.includes(m.sender);

        if (['responder', 'reply', 'r'].includes(command)) {
            if (!isOwner) return;
            if (!m.quoted) return m.reply('⚠ Error: Etiqueta el mensaje del reporte para responder.');

            const quotedContent = m.quoted.text || m.quoted.caption || '';
            if (!quotedContent.includes('⬡ NUEVO REPORTE RECIBIDO')) {
                return m.reply('⚠ Error: El mensaje etiquetado no es un reporte valido.');
            }

            try {
                const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];

                if (!userJid || !chatId) return m.reply('⚠ Error: Datos del reporte ilegibles.');

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
                return await m.reply('✓ Respuesta enviada con exito al destino original.');

            } catch (e) {
                return m.reply('☒ Error al procesar el envio de la respuesta.');
            }
        }

        if (!text) {
            return m.reply('⚠ USO INCORRECTO\n\nEscriba el reporte o idea despues del comando.\n\nEjemplo: ' + usedPrefix + command + ' el bot no responde imagenes');
        }

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        let reportMsg = '⬡ NUEVO REPORTE RECIBIDO\n\n' +
                        '⊛ Usuario: @' + m.sender.split('@')[0] + '\n' +
                        '⊛ Tipo: ' + command.toUpperCase() + '\n' +
                        '⊛ Mensaje: ' + text + '\n\n' +
                        '⌬ Chat ID: ' + m.chat;

        try {
            let media = null;
            if (mime && /image|video/.test(mime)) {
                media = await q.download();
            }

            for (const jid of owners) {
                const sendOptions = { mentions: [m.sender] };
                if (media) {
                    await conn.sendMessage(jid, { image: media, caption: reportMsg, ...sendOptions });
                } else {
                    await conn.sendMessage(jid, { text: reportMsg, ...sendOptions });
                }
            }

            await m.reply('✓ Reporte enviado con exito.\nLos administradores revisaran la informacion.');

        } catch (err) {
            await m.reply('☒ Error interno al procesar el reporte.');
        }
    }
};

export default reportSystem;
