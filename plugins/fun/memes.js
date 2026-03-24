import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const url_api = global.url_api || 'https://api.dix.lat';

        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`${url_api}/api/search/memes?apikey=voker`);
            const memesList = res.memes || res.result || (Array.isArray(res) ? res : null);
            const rawMeme = memesList[Math.floor(Math.random() * memesList.length)];
            let memeUrl = typeof rawMeme === 'string' ? rawMeme : (rawMeme.url || rawMeme.image || rawMeme.link);

            // Estos son los botones de respuesta exactos de tu imagen
            const buttons = [
                { buttonId: '.memes', buttonText: { displayText: '🔄 Siguiente Meme' }, type: 1 },
                { buttonId: '.menu', buttonText: { displayText: '📋 Menú Principal' }, type: 1 }
            ];

            const buttonMessage = {
                image: { url: memeUrl },
                caption: "*── 「 MEMES 」 ──*\n\n> 😂 ¡Tu dosis de humor diario!",
                footer: "Voker Systems • Deylin",
                buttons: buttons,
                headerType: 4
            };

            // Enviamos con sendMessage, que es el método estándar y más seguro
            await conn.sendMessage(m.chat, buttonMessage, { quoted: m });
            await m.react('✅');

        } catch (error) {
            console.error('Error en el comando memes:', error);
            await m.react('❌');
        }
    }
};

export default memesCommand;
