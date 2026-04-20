import axios from 'axios';

const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre de un paquete de stickers.');

        try {
            await m.react('🔍');
            const { data } = await axios.get(`https://sylphyy.xyz/search/stickerly?q=${encodeURIComponent(text)}&api_key=sylphy-hz8pNip`);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.react('✖️');
                return m.reply('No se encontraron resultados.');
            }

            const pack = data.result[0];
            const buffer = await axios.get(pack.thumbnailUrl, { responseType: 'arraybuffer' }).then(res => res.data);

            await conn.sendMessage(m.chat, {
                stickerPack: {
                    name: pack.name || 'Pack',
                    publisher: pack.author || 'Bot',
                    cover: buffer,
                    stickers: [{ data: buffer }],
                    packId: pack.url.split('/').pop() || 'baileys-pack',
                    description: `Pack: ${pack.name} - Autor: ${pack.author}`
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply('Error: ' + e.message);
        }
    }
};

export default stickerPackSearch;
