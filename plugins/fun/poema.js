import axios from 'axios';

const poemaCommand = {
    name: 'poema',
    alias: ['verso', 'poesia'],
    category: 'cultura',
    run: async (m, { conn, text }) => {
        const urlRaw = 'https://raw.githubusercontent.com/eliac-d/database/main/src/poemas.json';
        
        try {
            const response = await axios.get(urlRaw);
            let lista = response.data.poemas_masivos;

            if (text) {
                lista = lista.filter(p => 
                    p.autor.toLowerCase().includes(text.toLowerCase()) || 
                    p.titulo.toLowerCase().includes(text.toLowerCase())
                );
            }

            if (lista.length === 0) return;

            const p = lista[Math.floor(Math.random() * lista.length)];

            const mensaje = `📜 *${p.titulo.toUpperCase()}*\n\n${p.texto}\n\n_— ${p.autor}_ (${p.estilo})`;

            await conn.sendMessage(m.chat, { 
                text: mensaje,
                mentions: [m.sender] 
            }, { quoted: m });

        } catch (error) {
            console.error(error);
        }
    }
};

export default poemaCommand;
