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
                const sendOptions = {
                    mentions: [m.sender],
                    caption: media ? reportMsg : undefined,
                    text: media ? undefined : reportMsg
                };

                if (media) {
                    await conn.sendMessage(jid, { image: media, ...sendOptions });
                } else {
                    await conn.sendMessage(jid, sendOptions);
                }
            }

            await m.reply('✓ Reporte enviado con exito.\nLos administradores revisaran la informacion.');

        } catch (err) {
            await m.reply('☒ Error interno al procesar el reporte.');
        }
    }
};

export default reportCommand;
