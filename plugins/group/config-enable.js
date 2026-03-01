const enable = {
    name: 'enable',
    alias: ['welcome', 'bv', 'detect', 'gacha', 'antisub', 'antilink', 'antistatus', 'autosticker', 'autostickers'],
    category: 'config',
    admin: true,
    group: true,
    run: async function (m, { conn, command, chat, usedPrefix }) {

        const featureMap = {
            'welcome': 'welcome',
            'bv': 'welcome',
            'bienvenida': 'welcome',
            'detect': 'detect',
            'configuraciones': 'detect',
            'avisodegp': 'detect',
            'gacha': 'gacha',
            'antisub': 'antisub',
            'antilink': 'antiLink',
            'antistatus': 'antiStatus',
            'antiestados': 'antiStatus',
            'autosticker': 'autoStickers',
            'autostickers': 'autoStickers'
        };

        const type = command.toLowerCase();

        if (type === 'enable' || !featureMap[type]) {
            let menu = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n`;
            menu += `Estado actual de las funciones en este grupo:\n\n`;

            const options = [
                { name: 'Bienvenida', key: 'welcome' },
                { name: 'Detección', key: 'detect' },
                { name: 'Gacha System', key: 'gacha' },
                { name: 'Anti-SubBots', key: 'antisub' },
                { name: 'Anti-Links', key: 'antiLink' },
                { name: 'Anti-Status', key: 'antiStatus' },
                { name: 'Auto-Stickers', key: 'autoStickers' }
            ];

            options.forEach(opt => {
                const status = chat[opt.key] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                menu += `❖ *${opt.name}:* ${status}\n`;
            });

            menu += `\n> Para cambiar un estado usa el nombre de la función.\n> Ejemplo: *${usedPrefix}antilink*`;

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
        let icon = newValue ? '✰' : '✧';

        return m.reply(`> ${icon} ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText} ᴘᴀʀᴀ ᴇsᴛᴇ ᴄʜᴀᴛ.`);
    }
}

export default enable;
