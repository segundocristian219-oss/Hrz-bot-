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
            'isprem': 'isprem' // Nueva función
        };

        const type = command.toLowerCase();

        // Validación de seguridad: Solo el Owner puede activar el modo Premium/Global
        if (type === 'isprem' && !isROwner) return m.reply("> ❌ Solo el desarrollador puede activar el Modo Premium Global.");

        if (type === 'enable' || !featureMap[type]) {
            let menu = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n`;
            // ... (tus otras opciones)
            menu += `❖ *Premium Global:* ${global.opts['isprem'] ? '✅' : '❌'}\n`;
            return m.reply(menu.trim());
        }

        const dbKey = featureMap[type];

        if (type === 'isprem') {
            global.opts['isprem'] = !global.opts['isprem'];
            let statusText = global.opts['isprem'] ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
            return m.reply(`> 🌟 ᴍᴏᴅᴏ 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 𝗚𝗟𝗢𝗕𝗔𝗟 ${statusText}. Publicidad y subbots limitados.`);
        }

        const newValue = !chat[dbKey];
        await global.Chat.findOneAndUpdate({ id: m.chat }, { $set: { [dbKey]: newValue } }, { new: true });
        chat[dbKey] = newValue;
        return m.reply(`> ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${newValue ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}.`);
    }
}
export default enable;
