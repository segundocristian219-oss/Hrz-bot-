const enable = {
    name: 'enable',
    alias: ['welcome', 'bv', 'bienvenida', 'detect', 'configuraciones', 'avisodegp', 'gacha', 'antisub', 'antilink'],
    category: 'config',
    admin: true,
    group: true,
    run: async function (m, { conn, text, command, chat, usedPrefix }) {

        const args = text.split(/\s+/)
        const action = args[0]?.toLowerCase()

        if (!action || !['on', 'off'].includes(action)) {
            return m.reply(`✧ ¿Qué deseas hacer?\n\n> Uso: *${usedPrefix}${command} on* u *off*`)
        }

        let isEnable = action === 'on'
        let type = command.toLowerCase()
        let statusText = isEnable ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'
        let icon = isEnable ? '✰' : '卍'

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
            case 'antilink':
                chat.antiLink = isEnable
                break
            case 'enable':
            case 'enable_disable':
                return m.reply(`> Especifique la función. Ejemplo: *${usedPrefix}antilink on*`)
            default:
                return m.reply(`> La función *${type}* no está configurada.`)
        }

        return m.reply(`> ${icon} ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText} ᴘᴀʀᴀ ᴇsᴛᴇ ᴄʜᴀᴛ.`)
    }
}

export default enable
