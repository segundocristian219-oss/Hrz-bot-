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

                let content = { 
                    text: header + body,
                    mentions: [userJid] 
                };

                if (/image/.test(mime)) {
                    content = { 
                        image: await q.download(), 
                        caption: header + body, 
                        mentions: [userJid] 
                    };
                } else if (/video/.test(mime)) {
                    content = { 
                        video: await q.download(), 
                        caption: header + body, 
                        mentions: [userJid] 
                    };
                } else if (/audio/.test(mime)) {
                    content = { 
                        audio: await q.download(), 
                        mimetype: 'audio/mp4', 
                        ptt: true,
                        mentions: [userJid]
                    };
                }

                await conn.sendMessage(chatId, content, { 
                    quoted: { 
                        key: { 
                            remoteJid: chatId, 
                            fromMe: false, 
                            id: msgId, 
                            participant: userJid 
                        }, 
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
            return m.reply(`⚠ USO INCORRECTO\n\nEscribe el reporte o etiqueta un mensaje/imagen con texto.`);
        }

        let reportMsg = `┏━━━━ 「 NUEVO REPORTE RECIBIDO 」 ━━━━┓\n` +
                        `┃ ⊛ Usuario: @${m.sender.split('@')[0]}\n` +
                        `┃ ⊛ Tipo: ${command.toUpperCase()}\n` +
                        `┃ ⊛ Mensaje: ${reportText || '(Sin descripción)'}\n` +
                        `┃ ⌬ Chat ID: ${m.chat}\n` +
                        `┃ ◈ MSG ID: ${m.key.id}\n` +
                        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        try {
            let media = (mime && /image|video/.test(mime)) ? await q.download() : null;
            
            for (const jid of owners) {
                const opt = { 
                    mentions: [m.sender],
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: `REPORTE`,
                            body: `Reporte de: ${m.pushName || 'Usuario'}`,
                            mediaType: 1,
                            thumbnailUrl: img(),
                            renderLargerThumbnail: false,
                            sourceUrl: 'https://dix.lat'
                        }
                    }
                };

                if (media) {
                    await conn.sendMessage(jid, { 
                        [/image/.test(mime) ? 'image' : 'video']: media, 
                        caption: reportMsg, 
                        ...opt 
                    });
                } else {
                    await conn.sendMessage(jid, { text: reportMsg, ...opt });
                }
            }
            await m.reply('✓ Su reporte ha sido enviado a los desarrolladores.');
        } catch (err) {
            await m.reply('☒ Fallo al procesar el envío del reporte.');
        }
    }
};

export default reportSystem;
