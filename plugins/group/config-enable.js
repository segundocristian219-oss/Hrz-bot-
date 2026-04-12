const enable = {
    name: 'enable',
    alias: ['welcome', 'bv', 'detect', 'autosticker', 'antisub', 'antilink', 'antistatus', 'modoadmin', 'nsfw', 'isprem'], 
    category: 'config',
    admin: true,
    group: true,
    run: async function (m, { conn, command, chat, usedPrefix, isROwner }) {

        const featureMap = {
            'welcome': 'welcome',
            'bv': 'welcome',
            'detect': 'detect',
            'antisub': 'antisub',
            'antilink': 'antiLink',
            'nsfw': 'nsfw',
            'antistatus': 'antiStatus',
            'modoadmin': 'modoadmin', 
            'autosticker': 'autoStickers',
            'isprem': 'isprem'
        };

        const type = command.toLowerCase();

        if (type === 'isprem' && !isROwner) return;

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

            menu += `❖ *Premium:* ${global.opts['isprem'] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}\n`;
            return m.reply(menu.trim());
        }

        const dbKey = featureMap[type];

        if (type === 'isprem') {
            global.opts['isprem'] = !global.opts['isprem'];
            let statusText = global.opts['isprem'] ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
            return m.reply(`> ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText}.`);
        }

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
