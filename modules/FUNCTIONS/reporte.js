import axios from 'axios';

export const reportCommand = {
    category: 'main',
    commands: {
        reporte: {
            name: 'reporte',
            alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
            run: async (m, { conn, text, usedPrefix, command, isROwner }) => {
                const reportsCollection = global.db.collection('reports');

                if (['responder', 'reply', 'r'].includes(command)) {
                    if (!isROwner) return m.reply('Solo desarrolladores.');
                    if (!m.quoted) return m.reply('⚠ Etiqueta el reporte para responder.');

                    const quotedContent = m.quoted.text || m.quoted.caption || '';
                    if (!quotedContent.includes('「 NUEVO REPORTE RECIBIDO 」')) return m.reply('⚠ No es un reporte válido.');

                    try {
                        const userJid = quotedContent.split('⊛ Usuario: @')[1]?.split('\n')[0] + '@s.whatsapp.net';
                        const chatId = quotedContent.split('⌬ Chat ID: ')[1]?.split('\n')[0];
                        const msgId = quotedContent.split('◈ MSG ID: ')[1]?.split('\n')[0];
                        const botJid = quotedContent.split('🤖 Bot JID: ')[1]?.split('\n')[0]; 

                        if (!userJid || !chatId) return m.reply('⚠ Datos de destino ilegibles.');

                        let q = m;
                        let mime = (q.msg || q).mimetype || '';
                        const header = `⌬ RESPUESTA DEL DESARROLLADOR\n\n`;
                        const body = text || '';
                        let content = { text: header + body, mentions: [userJid] };

                        if (/image|video/.test(mime)) {
                            content = { [mime.split('/')[0]]: await q.download(), caption: header + body, mentions: [userJid] };
                        }

                        let targetConn = conn; 
                        const currentBotId = conn.user.id.split(':')[0];
                        const targetBotId = botJid ? botJid.split(':')[0] : null;

                        if (targetBotId && targetBotId !== currentBotId) {
                            const allConns = Array.from(global.conns.values());
                            const subBot = allConns.find(c => c.user && (c.user.id.split(':')[0] === targetBotId));
                            if (subBot) {
                                targetConn = subBot;
                            } else {
                                return m.reply('☒ El sub-bot que recibió este reporte no está activo actualmente.');
                            }
                        }

                        await targetConn.sendMessage(chatId, content, { 
                            quoted: { 
                                key: { remoteJid: chatId, fromMe: false, id: msgId, participant: userJid }, 
                                message: { conversation: quotedContent.split('⊛ Mensaje: ')[1]?.split('\n')[0] || "Reporte" } 
                            } 
                        });

                        return await m.reply(`✓ Respuesta enviada vía ${targetConn.isSub ? 'Sub-Bot' : 'Principal'}.`);
                    } catch (e) {
                        return m.reply('☒ Error: ' + e.message);
                    }
                }

                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';
                let reportText = (text || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '')).trim();

                if (!reportText || reportText.length === 0) {
                    return m.reply('⚠ El reporte no puede estar vacío.');
                }

                if (reportText.length < 10) {
                    return m.reply('⚠ Reporte muy corto. Describe mejor el problema (mínimo 10 caracteres).');
                }

                const isOnlyNumber = /^\+?[\d\s-]+$/.test(reportText);
                if (isOnlyNumber) {
                    return m.reply('⚠ No envíes solo números de teléfono. Explica el reporte con texto.');
                }

                try {
                    let mediaBuffer = null;
                    if (mime && /image|video/.test(mime)) {
                        mediaBuffer = await q.download();
                    }

                    await reportsCollection.insertOne({
                        botJid: conn.user.id, 
                        subBotName: conn.user.name || 'Kirito Sub-Bot',
                        sender: m.sender,
                        pushName: m.pushName || 'Usuario',
                        type: command.toUpperCase(),
                        message: reportText,
                        chatId: m.chat,
                        msgId: m.key.id,
                        mime: mime,
                        media: mediaBuffer ? mediaBuffer.toString('base64') : null,
                        timestamp: new Date()
                    });

                    const devNumber = global.dev1 + '@s.whatsapp.net';
                    const reportMsg = `「 NUEVO REPORTE RECIBIDO 」\n\n` +
                                      `⊛ Tipo: ${command.toUpperCase()}\n` +
                                      `⊛ Usuario: @${m.sender.split('@')[0]}\n` +
                                      `⊛ Nombre: ${m.pushName || 'Usuario'}\n` +
                                      `⌬ Chat ID: ${m.chat}\n` +
                                      `◈ MSG ID: ${m.key.id}\n` +
                                      `🤖 Bot JID: ${conn.user.id}\n` +
                                      `⊛ Mensaje: ${reportText}`;

                    if (mediaBuffer) {
                        await conn.sendMessage(devNumber, { [mime.split('/')[0]]: mediaBuffer, caption: reportMsg, mentions: [m.sender] });
                    } else {
                        await conn.sendMessage(devNumber, { text: reportMsg, mentions: [m.sender] });
                    }

                    await m.reply('✓ Reporte enviado al Centro de Control.');
                } catch (err) {
                    await m.reply('☒ Error: ' + err.message);
                }
            }
        }
    }
};
