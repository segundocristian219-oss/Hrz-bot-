const datosCommand = {
    name: 'datos',
    alias: ['info', 'userinfo'],
    category: 'tools',
    run: async (m, { conn }) => {
        // 1. Datos de quien envía el comando (ya procesados por tu smsg)
        let emisorNombre = m.pushName || 'Usuario';
        let emisorJid = m.sender;

        // 2. Datos del etiquetado o mencionado (usando tus nuevas propiedades)
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            let mencionadoNombre = m.mentionedNames[0]; // El nombre original de la cuenta
            let mencionadoJid = m.mentionedJid[0];
            
            let respuesta = `*📊 REPORTE DE USUARIOS*\n\n`;
            respuesta += `*👤 QUIÉN ETIQUETÓ:* ${emisorNombre}\n`;
            respuesta += `*🆔 ID Emisor:* ${emisorJid}\n\n`;
            respuesta += `*🎯 USUARIO ETIQUETADO:* ${mencionadoNombre}\n`;
            respuesta += `*🆔 ID Etiquetado:* ${mencionadoJid}\n\n`;
            respuesta += `*💬 Mensaje:* ${m.text}`;

            await m.reply(respuesta);
        } else if (m.quoted) {
            // Extra: También funciona si respondes a un mensaje sin etiquetar
            let respuesta = `*📊 REPORTE DE USUARIO (RESPONDIDO)*\n\n`;
            respuesta += `*👤 QUIÉN RESPONDIÓ:* ${emisorNombre}\n`;
            respuesta += `*🎯 USUARIO CITADO:* ${m.quoted.pushName}\n`;
            respuesta += `*🆔 ID Citado:* ${m.quoted.sender}`;
            
            await m.reply(respuesta);
        } else {
            await m.reply(`Hola ${emisorNombre}, para que esto funcione debes etiquetar a alguien con @ o responder a su mensaje.`);
        }
    }
};

export default datosCommand;
