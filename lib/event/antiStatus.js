import chalk from 'chalk';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m) return;

            // Log para ver qué tipo de mensaje llega al grupo
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            if (!isGroup) return;

            // 1. Detectamos por el StubType (Código de sistema de WhatsApp)
            // El código 118 es usualmente la mención de estado
            if (m.messageStubType) {
                console.log(chalk.bgMagenta.white(' [EVENTO DE SISTEMA DETECTADO] '));
                console.log(chalk.cyan('Tipo (StubType):'), m.messageStubType);
                console.log(chalk.cyan('Parámetros:'), m.messageStubParameters);
                
                if (m.messageStubType === 118) {
                    console.log(chalk.green('¡ESTO ES UNA MENCIÓN DE ESTADO (Código 118)!'));
                    // Intento de borrar inmediato si es 118
                    await conn.sendMessage(m.key.remoteJid, { delete: m.key });
                }
            }

            // 2. Detectamos por metadatos ocultos en el mensaje (ExternalAdReply)
            const contextInfo = m.message?.extendedTextMessage?.contextInfo || 
                                m.message?.imageMessage?.contextInfo || 
                                m.message?.videoMessage?.contextInfo;

            if (contextInfo?.externalAdReply) {
                console.log(chalk.bgBlue.white(' [AD-REPLY DETECTADO] '));
                console.dir(contextInfo.externalAdReply, { depth: null });

                // Si el origen dice "status", es la mención que buscas
                if (contextInfo.externalAdReply.sourceType === 'status') {
                    console.log(chalk.green('¡MENCIÓN DE ESTADO DETECTADA POR SOURCE TYPE!'));
                    await conn.sendMessage(m.key.remoteJid, { delete: m.key });
                }
            }

        } catch (e) {
            console.error(chalk.red('Error en prueba de mención:'), e);
        }
    });
}
