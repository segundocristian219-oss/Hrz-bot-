import fetch from 'node-fetch';

const shortCommand = {
    name: 'short',
    alias: ['acortar', 'short', 'corta'],
    category: 'tools',
    run: async (m, { text }) => {
        const apiVercel = 'https://api.dix.lat/short.php';

        if (!text) return m.reply('> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ.');

        try {
            await m.react('🕓');

            const res = await fetch(apiVercel, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: text })
            });
            
            const json = await res.json();

            if (json.status) {
                const shortUrl = json.url;
                const del = json.delete; 
                const shortqr = json.qr;


                let txt = `> 🔗 *ᴇɴʟᴀᴄᴇ ᴀᴄᴏʀᴛᴀᴅᴏ*\n\n`;
                txt += `> ✧ *ᴏʀɪɢɪɴᴀʟ:* ${text}\n`;
                txt += `> ✧ *ᴄᴏʀᴛᴏ:* ${shortUrl}\n`;
                txt += `> ✧ *ǫʀ:* ${shortqr}\n`;
                txt += `> ✧ *ᴅᴇʟᴀᴛᴇ:* ${del}\n`;
                txt += `> ☁️ *ɪɴғᴏ:* Developed by dix.lat.`;

                await m.reply(txt);
                await m.react('✅');
            }
        } catch (e) {
            await m.react('✖️');
            m.reply('> ⚔ ᴇʀʀᴏʀ ᴅᴇ ᴄᴏɴᴇxɪᴏɴ.');
        }
    }
};

export default shortCommand;
