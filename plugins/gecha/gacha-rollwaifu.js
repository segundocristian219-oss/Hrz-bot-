import { gachaService } from '../lib/gachaService.js'

const rollCommand = {
    name: 'roll',
    alias: ['rw', 'rollwaifu'],
    category: 'gacha',
    run: async (m, { conn, usedPrefix, command }) => {
        function encodeId(id) {
            return String(id)
                .split("")
                .map(d => {
                    const codes = {
                        "0": "\u200B", "1": "\u200C", "2": "\u200D",
                        "3": "\u2060", "4": "\u2061", "5": "\u2062",
                        "6": "\u2063", "7": "\u2064", "8": "\u2065"
                    }
                    return codes[d] || "\u2066"
                })
                .join("")
        }

        try {
            if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup)
                return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)

            global.db.data.groupGacha = global.db.data.groupGacha || {}
            const group = global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || {}
            group.users ||= {}
            group.characters ||= {}
            group.activeRolls ||= []

            const groupUser = group.users[m.sender] || (group.users[m.sender] = {})
            const now = Date.now()
            const cooldown = 15 * 60 * 1000

            if (groupUser.lastRoll && now < groupUser.lastRoll) {
                const remaining = Math.ceil((groupUser.lastRoll - now) / 1000)
                const min = Math.floor(remaining / 60)
                const sec = remaining % 60
                let msg = (min > 0 ? `${min} minuto${min !== 1 ? "s" : ""} ` : "") + (sec > 0 || min === 0 ? `${sec} segundo${sec !== 1 ? "s" : ""}` : "")
                return m.reply(`❖ Debes esperar *${msg.trim()}* para usar *${usedPrefix + command}* de nuevo.`)
            }

            const characters = await gachaService.getAllCharacters()
            if (!characters.length) return m.reply("⚠︎ No hay personajes disponibles en Supabase.")

            const character = characters[Math.floor(Math.random() * characters.length)]
            const charId = String(character.id)
            
            const claim = await gachaService.getClaim(charId, m.chat)
            let estado = "Libre"

            if (claim) {
                const who = claim.owner_jid
                let name = global.db.data.users?.[who]?.name
                if (!name) {
                    try {
                        const n = await conn.getName(who)
                        name = n && n.trim() ? n : who.split("@")[0]
                    } catch {
                        name = who.split("@")[0]
                    }
                }
                estado = `Reclamado por ${name}`
            }

            const protectionTime = 30 * 1000
            const rollData = {
                id: charId,
                name: character.name,
                value: character.buy || 100,
                gender: character.gender || "Desconocido",
                serie: character.source,
                reservedBy: m.sender,
                reservedUntil: now + protectionTime,
                createdAt: now,
                expiresAt: now + 60000,
                image: character.img
            }

            group.activeRolls.push(rollData)
            groupUser.lastRoll = now + cooldown

            const hiddenId = encodeId(charId)
            const text = `❀ Nombre » *${rollData.name}*${hiddenId}\n⚥ Género » *${rollData.gender}*\n✰ Valor » *${rollData.value.toLocaleString()}*\n♡ Estado » *${estado}*\n❖ Fuente » *${rollData.serie}*`

            await conn.sendMessage(m.chat, { image: { url: rollData.image }, caption: text }, { quoted: m })
        } catch (e) {
            console.error(e)
            await m.reply(`❖ Error en el sistema de base de datos.\n\n${e.message}`)
        }
    }
}

export default rollCommand;
