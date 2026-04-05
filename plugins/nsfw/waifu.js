import axios from 'axios';

const waifu = {
    name: 'waifu',
    alias: ['woman'],
    category: 'nsfw',
    nsfw: true,
    run: async (m, { conn }) => {
        try {
            await m.react('⏳');
            const apiUrl = 'https://api.yuki-wabot.my.id/nsfw/waifu';
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            
            if (!response.data) throw new Error();

            await conn.sendMessage(m.chat, { 
                image: Buffer.from(response.data), 
                caption: '_Aquí tienes tu imagen._' 
            }, { quoted: m });

            await m.react('✅');
        } catch (e) {
            await m.react('✖️');
        }
    }
};


export default waifu;