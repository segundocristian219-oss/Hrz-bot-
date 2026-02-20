const enableHandler = {
    name: 'enable_disable',
    alias: ['welcome', 'bv', 'bienvenida', 'detect', 'configuraciones', 'avisodegp', 'gacha', 'antisub'],
    category: 'config',
    admin: true,
    group: true,
    run: async function (m, { conn, text, command, chat, usedPrefix }) {
        
        if (!text || !['on', 'off'].includes(text.toLowerCase())) {
            return m.reply(`✧ ¿Qué deseas hacer?\n\n> Uso: *${usedPrefix}${command} on* u *off*`)
        }

        let isEnable = text.toLowerCase() === 'on'
        let type = command.toLowerCase()
        let statusText = isEnable ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'
        let icon = isEnable ? '✅' : '❌'

        switch (type) {
            case 'welcome':
            case 'bv':
            case 'bienvenida':
                chat.welcome = isEnable
                break

            case 'detect':
            case 'configuraciones':
            case 'avisodegp':
                chat.detect = isEnable
                break

            case 'gacha':
                chat.gacha = isEnable
                break

            case 'antisub':
                chat.antisub = isEnable
                break

            default:
                return m.reply(`> La función *${type}* no está configurada en este comando.`)
        }

        return m.reply(`> ${icon} ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText} ᴘᴀʀᴀ ᴇsᴛᴇ ᴄʜᴀᴛ.`)
    }
}

export default enableHandler
