import { dirname } from "path";
import { fileURLToPath } from "url";

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'ups'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!/audio|video|image/.test(mime)) return m.reply(`> *✎ Etiqueta un archivo.*`);

        try {
            await m.react('🕓');
            let media = await q.download();
            
            // Intentamos obtener la lista de contactos del store o la memoria
            let participants = Object.values(conn.contacts || {})
                .filter(v => v.id && v.id.endsWith('@s.whatsapp.net'))
                .map(v => v.id);

            // Si la lista está vacía, el estado no se verá. 
            // Como tienes "Mis contactos excepto", el bot necesita saber quiénes son tus contactos.
            if (participants.length === 0) {
                return m.reply("> *⚠ El bot no ha cargado tus contactos. Intenta escribirle a alguien o esperar a que se sincronicen.*");
            }

            const statusBroadcast = 'status@broadcast';

            let msg = {};
            if (/audio/.test(mime)) {
                msg = { 
                    audio: media, 
                    mimetype: 'audio/mp4', 
                    ptt: true,
                    waveform: [0,0,0,0,0,0,0] // Algunos dispositivos requieren esto para estados
                };
            } else if (/video/.test(mime)) {
                msg = { video: media, caption: m.text || '' };
            } else if (/image/.test(mime)) {
                msg = { image: media, caption: m.text || '' };
            }

            await conn.sendMessage(statusBroadcast, msg, { 
                statusJidList: participants 
            });

            await m.react('✅');
        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
