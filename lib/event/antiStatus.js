import chalk from 'chalk';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;

            // Filtramos solo eventos de sistema (Stub) o mensajes que no tengan texto común
            // para no saturar el grupo con mensajes normales
            const isStub = !!m.messageStubType;
            const isStatusNotify = m.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceType === 'status';

            if (isStub || isStatusNotify || !m.message?.conversation) {
                
                // Formateamos el objeto completo para que lo puedas copiar
                const report = {
                    messageStubType: m.messageStubType,
                    messageStubParameters: m.messageStubParameters,
                    message: m.message,
                    key: m.key
                };

                const textoParaGrupo = `*「 DETECCIÓN DE EVENTO 」*\n\n` +
                                       `*Tipo de Evento:* ${m.messageStubType || 'Mensaje con Metadatos'}\n` +
                                       `*JSON Completo:*\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``;

                // Enviamos los datos crudos al grupo para que los copies
                await conn.sendMessage(chatJid, { text: textoParaGrupo });
                
                console.log(chalk.green(`┃ [DEBUG] Datos enviados al grupo: ${chatJid}`));
            }
        } catch (e) {
            console.error('Error en el monitor de eventos:', e);
        }
    });
}
