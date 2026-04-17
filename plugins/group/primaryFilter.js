const primaryGroups = global.primaryGroups || (global.primaryGroups = new Map())

export default {
    name: '_primaryFilter',

    before: async (m, { conn }) => {
        try {
            const chat = m.chat
            const botId = conn.user.id

            const msgText = (m.text || m.msg?.caption || m.msg?.text || '').trim()
            const prefixes = ['#', '.', '/', '!']
            const usedPrefix = prefixes.find(p => msgText.startsWith(p))

            if (usedPrefix) {
                const cmd = msgText.slice(usedPrefix.length).split(/\s+/)[0].toLowerCase()
                if (cmd === 'setprimary' || cmd === 'delprimary') return false
            }

            if (!primaryGroups.has(chat)) return false

            const primary = primaryGroups.get(chat)

            if (primary !== botId) return true

            return false
        } catch (e) {
            return false
        }
    }
}
