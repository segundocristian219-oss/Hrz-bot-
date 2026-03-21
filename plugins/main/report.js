import axios from 'axios';

const reportSystem = {
    name: 'reporte',
    alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
    run: async (m, { conn, text, usedPrefix, command, isROwner }) => {
        const owners = (global.owner || []).map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');

        if (['responder', 'reply', 'r'].includes(command)) {
            if (!isROwner) return m.reply('solo desarrolladores');
            if (!m.quoted) return m.reply('⚠ USO INCORRECTO\n\nEtiqueta el reporte para responder.');

            const quotedContent = m.quoted.text || m.quoted.caption || '';
            if (!quotedContent.includes('「 NUEVO REPORTE RECIBIDO 」')) {
                return m.reply('⚠ ERROR\n\nEl mensaje no es un reporte.');
            }

            try {
                // Extracción de datos del cuerpo del reporte
                const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];
                const msgId = quotedContent.split('◈ MSG ID: ')[1]?.split('\n')[0];

                if (!userJid || !chatId || !msgId) return m.reply('⚠ ERROR\n\nDatos del mensaje original no encontrados.');

                let q = m;
                let mime = (q.msg || q).mimetype || '';
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

                // La clave aquí es el parámetro 'quoted', que vincula la respuesta al mensaje original del usuario
                await conn.sendMessage(chatId, content, { 
                    quoted: { 
                        key: { 
                            remoteJid: chatId, 
                            fromMe: false, 
                            id: msgId, 
                            participant: userJid 
                        }, 
                        message: { conversation: "Reporte Original" } 
                    } 
                });
                
                return await m.reply('✓ Respuesta enviada y vinculada al reporte.');
            } catch (e) {
                return m.reply('☒ Error al responder: ' + e.message);
            }
        }

        if (!text) return m.reply('⚠ USO INCORRECTO\n\nEscribe el reporte después del comando.');

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        // Estilo visual del reporte con el MSG ID incluido para poder responder después
        let reportMsg = `┏━━━━ 「 NUEVO REPORTE RECIBIDO 」 ━━━━┓\n` +
                        `┃ ⊛ Usuario: @${m.sender.split('@')[0]}\n` +
                        `┃ ⊛ Tipo: ${command.toUpperCase()}\n` +
                        `┃ ⊛ Mensaje: ${text}\n` +
                        `┃ ⌬ Chat ID: ${m.chat}\n` +
                        `┃ ◈ MSG ID: ${m.key.id}\n` + // Este ID es vital para etiquetar el mensaje luego
                        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        try {
            let media = (mime && /image|video/.test(mime)) ? await q.download() : null;
            for (const jid of owners) {
                const opt = { 
                    mentions: [m.sender],
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: `SISTEMA DE SOPORTE`,
                            body: `De: ${m.pushName || 'Usuario'}`,
                            mediaType: 1,
                            thumbnailUrl: img,
                            renderLargerThumbnail: false,
                            sourceUrl: 'https://dix.lat'
                        }
                    }
                };
                if (media) await conn.sendMessage(jid, { image: media, caption: reportMsg, ...opt });
                else await conn.sendMessage(jid, { text: reportMsg, ...opt });
            }
            await m.reply('✓ Reporte enviado correctamente.');
        } catch (err) {
            await m.reply('☒ Error al procesar el reporte.');
        }
    }
};

export default reportSystem;
