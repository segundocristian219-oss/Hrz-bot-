import axios from 'axios';

const reportSystem = {
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

                
                let targetConn = global.conn; 
                if (botJid && botJid !== global.conn.user.id) {
                    const subBot = global.conns.find(c => c.user && (c.user.id.split(':')[0] === botJid.split(':')[0]));
                    if (subBot) {
                        targetConn = subBot;
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
        let reportText = text || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '');

        try {
            let mediaBase64 = null;
            if (mime && /image|video/.test(mime)) {
                mediaBase64 = (await q.download()).toString('base64');
            }

            await reportsCollection.insertOne({
                botJid: conn.user.id, 
                subBotName: conn.user.name || 'Kirito Sub-Bot',
                sender: m.sender,
                pushName: m.pushName || 'Usuario',
                type: command.toUpperCase(),
                message: reportText || '(Sin descripción)',
                chatId: m.chat,
                msgId: m.key.id,
                mime: mime,
                media: mediaBase64,
                timestamp: new Date()
            });

            await m.reply('✓ Reporte enviado al Centro de Control.');
        } catch (err) {
            await m.reply('☒ Error en base de datos.');
        }
    }
};

export default reportSystem;
