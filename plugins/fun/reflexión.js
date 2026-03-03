import axios from 'axios';

const reflexionCommand = {
    name: 'reflexion',
    alias: ['consejo', 'frase', 'mentoria'],
    category: 'crecimiento',
    run: async (m, { conn, text }) => {
        const urlRaw = 'https://raw.githubusercontent.com/deylin-16/database/main/src/reflexion.json';
        
        try {
            const response = await axios.get(urlRaw);
            let lista = response.data.reflexiones_masivas;

            if (text) {
                lista = lista.filter(r => 
                    r.categoria.toLowerCase().includes(text.toLowerCase()) || 
                    r.autor.toLowerCase().includes(text.toLowerCase())
                );
            }

            if (lista.length === 0) return;

            const r = lista[Math.floor(Math.random() * lista.length)];

            const mensaje = `💡 *REFLEXIÓN DE PODER*\n\n` +
                          `*Categoría:* _${r.categoria}_\n` +
                          `──────────────────\n\n` +
                          `"${r.texto}"\n\n` +
                          `— *${r.autor}*`;

            await conn.sendMessage(m.chat, { 
                text: mensaje,
                mentions: [m.sender] 
            }, { quoted: m });

        } catch (error) {
            console.error('Error en suministro de reflexiones:', error);
        }
    }
};

export default reflexionCommand;
