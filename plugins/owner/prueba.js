const inspectAudio = {
    name: 'inspectaudio',
    alias: ['verjson', 'rawaudio'],
    category: 'tools',
    run: async (m, { conn }) => {
        const quoted = m.quoted ? m.quoted : m;
        
        if (!quoted) return conn.reply(m.chat, '❌ Etiqueta un audio.', m);

        try {
            // Extraemos el contenido crudo del mensaje citado
            const rawData = quoted.msg || quoted;
            
            // Convertimos todo el objeto a string, manejando los Buffers para que sean legibles
            const jsonString = JSON.stringify(rawData, (key, value) => {
                if (value && value.type === 'Buffer') return value.data; // Muestra el array del buffer
                if (Buffer.isBuffer(value)) return value.toString('base64'); // Lo pasa a base64 para que sea legible
                return value;
            }, 2);

            await conn.reply(m.chat, `*── 「 ESTRUCTURA RAW DEL AUDIO 」 ──*\n\n\`\`\`json\n${jsonString}\n\`\`\``, m);

        } catch (error) {
            await conn.reply(m.chat, '❌ Error al procesar el JSON.', m);
        }
    }
};

export default inspectAudio;
