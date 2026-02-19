import { gachaService } from '../../lib/gachaService.js'

const claimCommand = {
    name: 'claim',
    alias: ['c', 'reclamar'],
    category: 'gacha',
    run: async (m, { conn, usedPrefix, command }) => {
        function decodeId(str) {
            return String(str)
                .split("")
                .map(c => {
                    const codes = {
                        "\u200B": "0", "\u200C": "1", "\u200D": "2",
                        "\u2060": "3", "\u2061": "4", "\u2062": "5",
                        "\u2063": "6", "\u2064": "7", "\u2065": "8"
                    }
                    return codes[c] || "9"
                })
                .join("")
        }

        async function safeGetName(conn, id) {
            try {
                const name = await conn.getName(id)
                return name?.trim() ? name : id.split("@")[0]
            } catch {
                return id.split("@")[0]
            }
        }

        if (!m.quoted) return m.reply("✿ Debes *citar el mensaje del personaje* que quieres reclamar.")

        try {
            global.db.data.groupGacha = global.db.data.groupGacha || {}
            const group = global.db.data.groupGacha[m.chat] = global.db.data.groupGacha[m.chat] || {
                users: {},
                characters: {},
                activeRolls: []
            }

            const groupUser = group.users[m.sender] || (group.users[m.sender] = {})
            const now = Date.now()
            const cooldown = 30 * 60 * 1000

            if (groupUser.lastClaim && now < groupUser.lastClaim) {
                const remaining = Math.ceil((groupUser.lastClaim - now) / 1000)
                const min = Math.floor(remaining / 60)
                const sec = remaining % 60
                return m.reply(`❖ Espera *${min ? min + "m " : ""}${sec}s* para volver a usar *${usedPrefix + command}* de nuevo.`)
            }

            const quotedText = m.quoted?.text || ""
            const match = quotedText.match(/\*[^*]+\*([\u200B-\u2066]+)/)
            if (!match) return m.reply("❀ No es un personaje valido.")

            const charId = decodeId(match[1])
            const roll = group.activeRolls.find(r => r.id === charId)
            if (!roll) return m.reply("❀ No hay ningún personaje activo.")

            if (roll.expiresAt && now > roll.expiresAt && !roll.user && !(roll.reservedBy && now < roll.reservedUntil)) {
                const expiredTime = ((now - roll.expiresAt) / 1000).toFixed(1)
                group.activeRolls = group.activeRolls.filter(r => r.id !== charId)
                return m.reply(`ꕥ El personaje *${roll.name}* ha expirado »͜  ${expiredTime}s.`)
            }

            if (roll.reservedBy && roll.reservedBy !== m.sender && now < roll.reservedUntil) {
                const protector = await safeGetName(conn, roll.reservedBy)
                const remaining = Math.ceil((roll.reservedUntil - now) / 1000)
                return m.reply(`❀ Este personaje está protegido por *${protector}* durante *${remaining}s* más.`)
            }

            const charDB = await gachaService.getClaim(charId, m.chat)
            if (charDB) {
                const owner = await safeGetName(conn, charDB.owner_jid)
                return m.reply(`❀ *${roll.name}* ya fue reclamado por *${owner}*.`)
            }

            await gachaService.setClaim(charId, m.chat, m.sender)

            roll.user = m.sender
            roll.claimedAt = now
            roll.expiresAt = null
            roll.reservedBy = null
            roll.reservedUntil = null

            groupUser.lastClaim = now + cooldown
            const userName = await safeGetName(conn, m.sender)
            const claimTime = roll.createdAt ? ((now - roll.createdAt) / 1000).toFixed(1) : "0"

            const userData = global.db.data.users[m.sender] || {}
            const customMsg = userData.claimMessage
            const defaultClaimMsg = "€character ha sido reclamado por €user"
            const finalMessage = (customMsg || defaultClaimMsg)
                .replace(/€user/g, `*${userName}*`)
                .replace(/€character/g, `*${roll.name}*`)

            await conn.reply(m.chat, `❀ ${finalMessage} (${claimTime}s)`, m)

            setTimeout(() => {
                group.activeRolls = group.activeRolls.filter(r => r.id !== charId)
            }, 5000)

        } catch (e) {
            console.error(e)
            await m.reply(`⚠︎ Error al procesar el reclamo.\n\n${e.message}`)
        }
    }
}

export default claimCommand;
