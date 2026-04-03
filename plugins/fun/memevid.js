import axios from 'axios';

const memeApiCommand = {
    name: 'memevid',
    alias: ['meme2', 'dixmeme'],
    category: 'fun',
    run: async (m, { conn }) => {
        await m.react('⏳');
        
        try {
            const { data } = await axios.get('https://api.dix.lat/memevid');

            if (!data || !data.url) {
                throw new Error('No se recibió una URL válida de la API');
            }

            await m.react('🎬');
            await conn.sendMessage(m.chat, { 
                video: { url: data.url }, 
                caption: '*_ʕ˖͜͡˖ʔ Mira esté meme aleatorio._*' 
            }, { quoted: m });

        } catch (err) {
            console.error("API_ERROR:", err.message);
            await m.react('🚫');
            await conn.sendMessage(m.chat, { 
                text: `*×᷼× ERROR AL OBTENER MEME*\n\n*Detalle:* ${err.message}` 
            }, { quoted: m });
        }
    }
};

export default memeApiCommand;
