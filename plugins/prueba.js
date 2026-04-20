import axios from 'axios';

const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre de un paquete de stickers.');

        try {
            await m.react('🕒');
            const { data } = await axios.get(`https://sylphyy.xyz/search/stickerly?q=${encodeURIComponent(text)}&api_key=sylphy-hz8pNip`);

            if (!data.status || !data.result || data.result.length === 0) {
                await m.react('✖️');
                return m.reply('No se encontraron resultados.');
            }

            const pack = data.result[0];
            const response = await axios.get(pack.thumbnailUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await conn.sendMessage(m.chat, {
                stickerPack: {
                    name: pack.name.trim() || 'Pack',
                    publisher: pack.author.trim() || 'Bot',
                    cover: buffer,
                    stickers: [
                        {
                            data: buffer,
                            mimetype: 'image/webp'
                        }
                    ],
                    packId: pack.url.split('/').pop() || 'baileys-pack',
                    description: pack.name || 'Sticker Pack'
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            console.error(e);
            m.reply('Error: ' + e.message);
        }
    }
};

export default stickerPackSearch;
