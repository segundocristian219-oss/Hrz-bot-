const datosCommand = {
    name: 'datos',
    alias: ['info'],
    category: 'tools',
    run: async (m, { conn }) => {
        let emisorNombre = m.pushName || global.db.data?.users[m.sender]?.name || 'Usuario';
        
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            let mencionadoJid = m.mentionedJid[0];
            // Buscamos el nombre en menciones, luego en DB, luego número
            let mencionadoNombre = m.mentionedNames[0] || global.db.data?.users[mencionadoJid]?.name || mencionadoJid.split('@')[0];
            
            let respuesta = `*📊 REPORTE DE USUARIOS*\n\n`;
            respuesta += `*👤 QUIÉN ETIQUETÓ:* ${emisorNombre}\n`;
            respuesta += `*🎯 USUARIO ETIQUETADO:* ${mencionadoNombre}\n`;
            respuesta += `*🆔 ID Etiquetado:* ${mencionadoJid}`;
            await m.reply(respuesta);

        } else if (m.quoted) {
            let citadoNombre = m.quoted.pushName || global.db.data?.users[m.quoted.sender]?.name || m.quoted.sender.split('@')[0];
            
            let respuesta = `*📊 REPORTE DE USUARIO (RESPONDIDO)*\n\n`;
            respuesta += `*👤 QUIÉN RESPONDIÓ:* ${emisorNombre}\n`;
            respuesta += `*🎯 USUARIO CITADO:* ${citadoNombre}\n`;
            respuesta += `*🆔 ID Citado:* ${m.quoted.sender}`;
            await m.reply(respuesta);
        } else {
            await m.reply(`Etiqueta a alguien o responde a un mensaje.`);
        }
    }
};
