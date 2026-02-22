import chalk from 'chalk';

export default function(conn) {
    // Escuchar absolutamente todas las actualizaciones de mensajes y eventos de grupo
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m) return;

        // Si hay una mención de estado, WhatsApp suele enviarla sin mensaje (solo el stub)
        if (m.messageStubType) {
            console.log(chalk.bgYellow.black(' ℹ️ EVENTO DE SISTEMA DETECTADO '));
            console.log(chalk.white(`┃ Chat: ${m.key.remoteJid}`));
            console.log(chalk.white(`┃ Tipo (StubType): ${m.messageStubType}`));
            console.log(chalk.white(`┃ Parámetros: ${JSON.stringify(m.messageStubParameters)}`));
            
            // Si detectamos que el StubType es de mención, lo borramos aquí mismo
            if (m.messageStubType === 118 || m.messageStubType === 119) {
                console.log(chalk.bgRed.white(' ❗ MENCIÓN DE ESTADO DETECTADA POR STUB '));
                await conn.sendMessage(m.key.remoteJid, { delete: m.key });
            }
        }

        // Si es un mensaje con datos ocultos
        if (m.message) {
            console.log(chalk.bgBlue.white(' ✉️ MENSAJE ENTRANTE '));
            console.dir(m.message, { depth: 2 });
        }
    });

    // Escuchar actualizaciones de chats (a veces las menciones vienen aquí)
    conn.ev.on('chats.update', update => {
        if (update[0]?.lastMessage?.messageStubType) {
            console.log(chalk.bgCyan.black(' ℹ️ ACTUALIZACIÓN DE CHAT DETECTADA '));
            console.dir(update, { depth: null });
        }
    });
}
