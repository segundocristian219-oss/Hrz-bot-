import { gachaService } from '../../lib/gachaService.js'

const infoCommand = {
    name: 'ginfo',
    alias: ['gachainfo', 'infogacha'],
    category: 'gacha',
    run: async (m, { conn, usedPrefix, command }) => {
        function formatTime(ms) {
            if (ms <= 0) return "Ahora"
            const totalSeconds = Math.ceil(ms / 1000)
            const hours = Math.floor(totalSeconds / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60
            let parts = []
            if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`)
            if (minutes > 0 || hours > 0) parts.push(`${minutes} minuto${minutes !== 1 ? "s" : ""}`)
            parts.push(`${seconds} segundo${seconds !== 1 ? "s" : ""}`)
            return parts.join(" ")
        }

        try {
            const chatData = global.db.data.chats?.[m.chat] || {}
            if (!chatData.gacha && m.isGroup) {
                return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
            }

            global.db.data.groupGacha = global.db.data.groupGacha || {}
            const group = global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || { users: {} }
            const user = group.users[m.sender] || (group.users[m.sender] = {})

            const now = Date.now()
            const claimCD = user.lastClaim && now < user.lastClaim ? user.lastClaim - now : 0
            const rollCD = user.lastRoll && now < user.lastRoll ? user.lastRoll - now : 0
            const voteCD = user.lastVote && now < user.lastVote ? user.lastVote - now : 0

            const allCharacters = await gachaService.getAllCharacters()
            const userClaims = await gachaService.getUserClaims(m.chat, m.sender)

            const claimedIds = userClaims.map(c => c.character_id)
            const myCharacters = allCharacters.filter(c => claimedIds.includes(c.id))
            
            const totalValue = myCharacters.reduce((sum, c) => sum + (Number(c.buy) || 0), 0)
            const totalSeries = [...new Set(allCharacters.map(c => c.source))].length

            const userName = global.db.data.users[m.sender]?.name || (await conn.getName(m.sender)) || m.sender.split("@")[0]

            const infoMsg = `*❀ Usuario* \`<${userName}>\`

ⴵ Claim » *${formatTime(claimCD)}*
ⴵ RollWaifu » *${formatTime(rollCD)}*
ⴵ Vote » *${formatTime(voteCD)}*

♡ Personajes reclamados » *${myCharacters.length}*
✰ Valor total » *${totalValue.toLocaleString()}*
❏ Personajes totales » *${allCharacters.length}*
❏ Series totales » *${totalSeries}*`

            await m.reply(infoMsg.trim())
        } catch (e) {
            console.error(e)
            await m.reply(`⚠︎ Se ha producido un problema.\n\n${e.message}`)
        }
    }
}

export default infoCommand;
