import { dirname } from "path";
import { fileURLToPath } from "url";

const statusCommand = {
    name: 'setstatus',
    alias: ['estado'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!/audio|video|image/.test(mime)) return m.reply(`> *✎ Etiqueta algo.*`);

        try {
            await m.react('🕓');
            let media = await q.download();
            
            // DIAGNÓSTICO: Ver cuántos contactos reconoce el bot
            let totalContacts = Object.keys(conn.contacts || {}).length;
            
            // Creamos la lista de personas que verán el estado
            // 1. Agregamos a todos los contactos que el bot tiene en memoria
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);

            // 2. FORZADO: Si la lista es pequeña o vacía, te agregamos a ti y al bot
            // Esto sirve para verificar si al menos TÚ puedes ver el estado
            if (!participants.includes(m.sender)) participants.push(m.sender);
            let botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            if (!participants.includes(botJid)) participants.push(botJid);

            const statusBroadcast = 'status@broadcast';

            let msg = {};
            if (/audio/.test(mime)) {
                msg = { 
                    audio: media, 
                    mimetype: 'audio/mp4', 
                    ptt: true,
                    seconds: 30
                };
            } else if (/video/.test(mime)) {
                msg = { video: media, caption: m.text || '' };
            } else if (/image/.test(mime)) {
                msg = { image: media, caption: m.text || '' };
            }

            // ENVIAR
            await conn.sendMessage(statusBroadcast, msg, { 
                statusJidList: participants 
            });

            await m.react('✅');
            await m.reply(`> *INFO:* Estado enviado a ${participants.length} personas (Contactos en memoria: ${totalContacts}).`);

        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
