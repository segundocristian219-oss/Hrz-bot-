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

    before: async function (m, { conn }) {
        const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        
        if (!m.quoted || !m.quoted.fromMe || !owners.includes(m.sender)) return false;
        if (!m.quoted.text && !m.quoted.caption) return false;

        const quotedContent = m.quoted.text || m.quoted.caption || '';
        if (!quotedContent.includes('⬡ NUEVO REPORTE RECIBIDO')) return false;

        try {
            const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
            const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];

            if (!userJid || !chatId) return false;

            let q = m;
            let mime = (q.msg || q).mimetype || '';
            let isGroup = chatId.endsWith('@g.us');
            
            let content = { mentions: isGroup ? [userJid] : [] };
            const header = '⌬ RESPUESTA DEL DESARROLLADOR\n\n';
            const replyBody = m.text || '';

            if (/image/.test(mime)) {
                content.image = await q.download();
                content.caption = header + replyBody;
            } else if (/video/.test(mime)) {
                content.video = await q.download();
                content.caption = header + replyBody;
            } else if (/audio/.test(mime)) {
                content.audio = await q.download();
                content.mimetype = 'audio/mp4';
                content.ptt = true;
            } else {
                content.text = header + replyBody;
            }

            await conn.sendMessage(chatId, content, { quoted: isGroup ? m : null });
            await m.react('✅');
            return true;

        } catch (e) {
            console.error(e);
            await m.react('✖');
            return false;
        }
    }
};

export default reportCommand;
