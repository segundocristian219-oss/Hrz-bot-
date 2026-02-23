import fetch from 'node-fetch';

const shortCommand = {
    name: 'short',
    alias: ['acortar', 'short', 'corta'],
    category: 'tools',
    run: async (m, { text }) => {
        const apiVercel = 'https://dix.lat/v1/short.php';

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
                const shortUrl = `${json.url}`;

                let txt = `> 🔗 *ᴇɴʟᴀᴄᴇ ᴀᴄᴏʀᴛᴀᴅᴏ*\n\n`;
                txt += `> ✧ *ᴏʀɪɢɪɴᴀʟ:* ${text}\n`;
                txt += `> ✧ *ᴄᴏʀᴛᴏ:* ${shortUrl}\n\n`;
                txt += `> ☁️ *ɪɴғᴏ:* ʟᴀ ɪɴғᴏʀᴍᴀᴄɪᴏɴ sᴇ ʜᴀ ɢᴜᴀʀᴅᴀᴅᴏ ᴇɴ ʟᴀ ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs ᴅᴇ ʟᴀ ʀᴇᴅ ᴢ .`;

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
