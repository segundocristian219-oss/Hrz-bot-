import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const statusAudioCommand = {
    name: 'subiraudio',
    alias: ['setaudio', 'estaudio'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        // Validación de seguridad y tipo de mensaje
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);
        
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        // Solo procesamos si es audio
        if (!/audio/.test(mime)) {
            return m.reply("> *⚠ Etiqueta o envía un audio para subirlo como nota de voz.*");
        }

        try {
            await m.react('🕓');

            // 1. Descargamos el buffer del audio (Calidad Digital Original)
            const audioBuffer = await q.download();
            
            // 2. Definimos una onda de sonido (waveform) para que parezca grabado
            // Esto genera una visualización de barras en el estado
            const fakeWaveform = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100));

            // 3. Enviamos al JID de estados (status@broadcast)
            await conn.sendMessage(
                'status@broadcast',
                {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4', // Compatible con estados de voz
                    ptt: true,             // CLAVE: Activa el modo nota de voz
                    waveform: fakeWaveform 
                },
                {
                    // Obtener la lista de JIDs de tus contactos si quieres privacidad específica, 
                    // de lo contrario WhatsApp usa tu configuración por defecto.
                    statusJidList: [m.sender], 
                    backgroundColor: '#1c1c1e', // Color de fondo del estado
                    font: 3 
                }
            );

            await m.react('✅');
            await m.reply(`> *🔥 Audio subido con éxito como Nota de Voz.*`);

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply(`> *❌ Error al procesar el audio:* ${e.message}`);
        }
    }
}

export default statusAudioCommand;
