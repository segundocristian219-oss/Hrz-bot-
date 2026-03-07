import axios from 'axios';

const reportCommand = {
    name: 'reporte',
    alias: ['report', 'bug', 'idea', 'sugerencia'],
    category: 'main',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');

        if (!text) {
            return m.reply('⚠ USO INCORRECTO\n\nEscriba el reporte o idea después del comando.\n\nEjemplo: ' + usedPrefix + command + ' el sistema presenta lentitud');
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
    },

    all: async function (m, { conn }) {
        const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        if (!owners.includes(m.sender) || !m.quoted || !m.quoted.text) return;

        const quotedText = m.quoted.text;
        if (!quotedText.includes('⬡ NUEVO REPORTE RECIBIDO')) return;

        try {
            const userJid = quotedText.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
            const chatId = quotedText.split('⌬ Chat ID: ')[1]?.split('\n')[0];

            if (!userJid || !chatId) return;

            let q = m;
            let mime = (q.msg || q).mimetype || '';
            let content = { mentions: [userJid] };
            let isGroup = chatId.endsWith('@g.us');

            const replyText = m.text ? '⌬ RESPUESTA DEL DESARROLLADOR\n\n' + m.text : '⌬ RESPUESTA DEL DESARROLLADOR';

            if (/image/.test(mime)) content.image = await q.download();
            else if (/video/.test(mime)) content.video = await q.download();
            else if (/audio/.test(mime)) {
                content.audio = await q.download();
                content.mimetype = 'audio/mp4';
                content.ptt = true;
            }

            if (content.image || content.video) content.caption = replyText;
            else if (!content.audio) content.text = replyText;

            await conn.sendMessage(chatId, content);
            await m.reply('✓ Respuesta enviada correctamente.');

        } catch (e) {
            console.error(e);
            await m.reply('☒ Error al reenviar la respuesta.');
        }
    }
};

export default reportCommand;
