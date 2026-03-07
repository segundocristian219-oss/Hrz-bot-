import axios from 'axios';

const reportSystem = {
    name: 'reporte',
    alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
    category: 'main',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const owners = (global.owner || []).map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        const isOwner = owners.includes(m.sender.split(':')[0] + '@s.whatsapp.net') || m.fromMe;

        if (['responder', 'reply', 'r'].includes(command)) {
            if (!isOwner) return;
            if (!m.quoted) return m.reply('⚠ USO INCORRECTO\n\nEtiqueta el reporte para responder.');

            const quotedContent = m.quoted.text || m.quoted.caption || '';
            if (!quotedContent.includes('⬡ NUEVO REPORTE RECIBIDO')) {
                return m.reply('⚠ ERROR\n\nEl mensaje no es un reporte.');
            }

            try {
                const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];

                if (!userJid || !chatId) return m.reply('⚠ ERROR\n\nDatos ilegibles.');

                let q = m;
                let mime = (q.msg || q).mimetype || '';
                let isGroup = chatId.endsWith('@g.us');
                let content = { mentions: [userJid] };
                
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
                    if (!text) return m.reply('⚠ ERROR\n\nEscribe un mensaje.');
                    content.text = header + body;
                }

                await conn.sendMessage(chatId, content);
                return await m.reply('✓ Enviado.');
            } catch (e) {
                return m.reply('☒ Error: ' + e.message);
            }
        }

        if (!text) return m.reply('⚠ USO INCORRECTO\n\nEscribe el reporte despues del comando.');

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        let reportMsg = '⬡ NUEVO REPORTE RECIBIDO\n\n' +
                        '⊛ Usuario: @' + m.sender.split('@')[0].split(':')[0] + '\n' +
                        '⊛ Tipo: ' + command.toUpperCase() + '\n' +
                        '⊛ Mensaje: ' + text + '\n\n' +
                        '⌬ Chat ID: ' + m.chat;

        try {
            let media = (mime && /image|video/.test(mime)) ? await q.download() : null;
            for (const jid of owners) {
                const opt = { mentions: [m.sender] };
                if (media) await conn.sendMessage(jid, { image: media, caption: reportMsg, ...opt });
                else await conn.sendMessage(jid, { text: reportMsg, ...opt });
            }
            await m.reply('✓ Reporte enviado.');
        } catch (err) {
            await m.reply('☒ Error interno.');
        }
    }
};

export default reportSystem;
