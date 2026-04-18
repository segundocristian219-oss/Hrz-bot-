import axios from 'axios';

const reportSystem = {
    name: 'reporte',
    alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
    run: async (m, { conn, text, usedPrefix, command, isROwner }) => {
        const reportsCollection = global.db.collection('reports');

        if (['responder', 'reply', 'r'].includes(command)) {
            if (!isROwner) return m.reply('solo desarrolladores');
            if (!m.quoted) return m.reply('⚠ USO INCORRECTO\n\nEtiqueta el reporte para responder.');

            const quotedContent = m.quoted.text || m.quoted.caption || '';
            if (!quotedContent.includes('「 NUEVO REPORTE RECIBIDO 」')) {
                return m.reply('⚠ ERROR\n\nEl mensaje no es un reporte válido.');
            }

            try {
                const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];
                const msgId = quotedContent.split('◈ MSG ID: ')[1]?.split('\n')[0];

                if (!userJid || !chatId) return m.reply('⚠ ERROR\n\nDatos de destino ilegibles.');

                let q = m;
                let mime = (q.msg || q).mimetype || '';
                const header = `⌬ RESPUESTA DEL DESARROLLADOR\n\n`;
                const body = text || '';

                let content = { text: header + body, mentions: [userJid] };

                if (/image/.test(mime)) {
                    content = { image: await q.download(), caption: header + body, mentions: [userJid] };
                } else if (/video/.test(mime)) {
                    content = { video: await q.download(), caption: header + body, mentions: [userJid] };
                } else if (/audio/.test(mime)) {
                    content = { audio: await q.download(), mimetype: 'audio/mp4', ptt: true, mentions: [userJid] };
                }

                await conn.sendMessage(chatId, content, { 
                    quoted: { 
                        key: { remoteJid: chatId, fromMe: false, id: msgId, participant: userJid }, 
                        message: { conversation: quotedContent.split('⊛ Mensaje: ')[1]?.split('\n')[0] || "Reporte" } 
                    } 
                });

                return await m.reply('✓ Respuesta enviada con éxito.');
            } catch (e) {
                return m.reply('☒ Error al responder: ' + e.message);
            }
        }

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let reportText = text || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '');

        if (!reportText && !/image|video/.test(mime)) {
            return m.reply(`⚠ USO INCORRECTO\n\nEscribe el reporte o etiqueta un mensaje.`);
        }

        try {
            let mediaBase64 = null;
            if (mime && /image|video/.test(mime)) {
                mediaBase64 = (await q.download()).toString('base64');
            }

            await reportsCollection.insertOne({
                subBotName: conn.user.name || 'Sub-Bot',
                sender: m.sender,
                pushName: m.pushName || 'Usuario',
                type: command.toUpperCase(),
                message: reportText || '(Sin descripción)',
                chatId: m.chat,
                msgId: m.key.id,
                mime: mime,
                media: mediaBase64,
                status: 'pending',
                timestamp: new Date()
            });

            await m.reply('✓ Su reporte ha sido enviado al Centro de Control.');
        } catch (err) {
            await m.reply('☒ Error al procesar el reporte en base de datos.');
        }
    }
};

export default reportSystem;
