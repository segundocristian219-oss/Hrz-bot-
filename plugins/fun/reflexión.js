import axios from 'axios';

const reflexionCommand = {
    name: 'reflexion',
    alias: ['reflexión', 'meditar', 'existencia'],
    category: 'crecimiento',
    run: async (m, { conn, text }) => {
        
        const urlRaw = 'https://raw.githubusercontent.com/eliac-d/database/main/src/reflexion.json';

        try {
            const response = await axios.get(urlRaw);
            
            const lista = Array.isArray(response.data) ? response.data : response.data.reflexiones;

            let filtradas = lista;

            
            if (text) {
                filtradas = lista.filter(r => 
                    r.tema.toLowerCase().includes(text.toLowerCase()) ||
                    r.titulo.toLowerCase().includes(text.toLowerCase())
                );
            }

            if (filtradas.length === 0) filtradas = lista;

            
            const r = filtradas[Math.floor(Math.random() * filtradas.length)];

            
            const mensaje = `✨ *${r.titulo}*\n` +
                          `_Categoría: ${r.tema}_\n` +
                          `──────────────────\n\n` +
                          `${r.wa_format}\n\n` +
                          `*Propósito:* _Apoyo emocional digital._`;

            await conn.sendMessage(m.chat, { 
                text: mensaje,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: 'SISTEMA DE REFLEXIÓN CÓSMICA',
                        body: 'Conéctate con el universo',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1000&auto=format&fit=crop', 
                        sourceUrl: 'https://github.com/deylin-16/database',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('Error en suministro de reflexiones:', error);
            await conn.sendMessage(m.chat, { text: '❌ Error al conectar con la base de datos estelar.' }, { quoted: m });
        }
    }
};

export default reflexionCommand;
