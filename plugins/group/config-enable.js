const enable = {
    name: 'enable',
    alias: ['welcome', 'bv', 'detect', 'autosticker', 'antisub', 'antilink', 'antistatus', 'modoadmin', 'nsfw'], 
    category: 'config',
    admin: true,
    group: true,
    run: async function (m, { conn, command, chat, usedPrefix }) {

        const featureMap = {
            'welcome': 'welcome',
            'bv': 'welcome',
            'detect': 'detect',
            'gacha': 'gacha',
            'antisub': 'antisub',
            'antilink': 'antiLink',
            'nsfw': 'nsfw',
            'antistatus': 'antiStatus',
            'modoadmin': 'modoadmin', 
            'autosticker': 'autoStickers',
        };

        const type = command.toLowerCase();

        if (type === 'enable' || !featureMap[type]) {
            let menu = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n`;
            const options = [
                { name: 'Bienvenida', key: 'welcome' },
                { name: 'Detección', key: 'detect' },
                { name: 'Anti-Links', key: 'antiLink' },
                { name: 'Modo Admin', key: 'modoadmin' }, 
                { name: 'Nsfw', key: 'nsfw' }, 
                { name: 'Auto-Stickers', key: 'autoStickers' }
            ];

            options.forEach(opt => {
                const status = chat[opt.key] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                menu += `❖ *${opt.name}:* ${status}\n`;
            });
            return m.reply(menu.trim());
        }

        const dbKey = featureMap[type];
        const newValue = !chat[dbKey];

        await global.Chat.findOneAndUpdate(
            { id: m.chat },
            { $set: { [dbKey]: newValue } },
            { new: true }
        );

        chat[dbKey] = newValue;
        let statusText = newValue ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
        return m.reply(`> ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText}.`);
    }
}
export default enable;

