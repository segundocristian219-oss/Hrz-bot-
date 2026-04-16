const sandboxCommand = {
    name: 'sandbox',
    alias: ['test', 'prueba'],
    category: 'tools',
    run: async (m, { conn, usedPrefix, command }) => {
        const frames = [
            " [ ⚡ ] Analizando entorno...",
            " [ 🛠️ ] Configurando buffers...",
            " [ 💾 ] Cargando módulos...",
            " [ ✅ ] Proceso finalizado."
        ];

        const { key } = await conn.sendMessage(m.chat, { text: " [ ⏳ ] Iniciando sandbox..." }, { quoted: m });

        for (const frame of frames) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await conn.sendMessage(m.chat, { 
                text: frame, 
                edit: key 
            });
        }
    }
};

export default sandboxCommand;
