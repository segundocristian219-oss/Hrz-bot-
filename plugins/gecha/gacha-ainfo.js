import { gachaService } from '../../lib/gachaService.js'
import stringSimilarity from "string-similarity"

const ainfoCommand = {
    name: 'ainfo',
    alias: ['animeinfo'],
    category: 'gacha',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup)
                return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)

            if (!args[0])
                return m.reply(`❀ Debes especificar la serie.\n> Ejemplo: *${usedPrefix + command} Blue Archive*`)

            let page = 1
            const pageArg = args.find(a => /^page=\d+$/i.test(a))
            if (pageArg) page = parseInt(pageArg.split("=")[1]) || 1
            const seriesNameQuery = args.filter(a => a !== pageArg).join(" ").trim()

            const allCharacters = await gachaService.getAllCharacters()
            const allSeries = [...new Set(allCharacters.map(c => c.source))]
            
            let bestSeries = null
            const exact = allSeries.find(s => s.toLowerCase() === seriesNameQuery.toLowerCase())
            
            if (exact) {
                bestSeries = exact
            } else {
                const match = stringSimilarity.findBestMatch(seriesNameQuery, allSeries)
                if (match.bestMatch.rating >= 0.4) bestSeries = match.bestMatch.target
            }

            if (!bestSeries)
                return m.reply(`ꕥ No se encontró la serie *${seriesNameQuery}*.\n> Usa ${usedPrefix}suggest Sugerencia de la serie: ${seriesNameQuery}`)

            const seriesCharacters = allCharacters.filter(c => c.source === bestSeries)
            const total = seriesCharacters.length

            let claimedCount = 0
            const charactersWithStatus = await Promise.all(seriesCharacters.map(async (c) => {
                const claim = await gachaService.getClaim(c.id, m.chat)
                let ownerName = null
                if (claim) {
                    claimedCount++
                    try {
                        ownerName = global.db.data.users[claim.owner_jid]?.name || await conn.getName(claim.owner_jid) || claim.owner_jid.split("@")[0]
                    } catch {
                        ownerName = claim.owner_jid.split("@")[0]
                    }
                }
                return { ...c, ownerName }
            }))

            const percent = ((claimedCount / total) * 100).toFixed(0)
            const perPage = 50
            const totalPages = Math.ceil(total / perPage)

            if (page > totalPages)
                return m.reply(`❀ La página *${page}* no existe.\n> Esta serie solo tiene *${totalPages}* páginas.`)

            const start = (page - 1) * perPage
            const end = Math.min(start + perPage, total)
            
            let text = `*❀ Nombre:* \`<${bestSeries}>\`\n\n`
            text += `❏ Personajes » *\`${total}\`*\n`
            text += `♡ Reclamados » *\`${claimedCount}/${total} (${percent}%)\`*\n`
            text += `❏ Lista de personajes:\n\n`

            for (let i = start; i < end; i++) {
                const c = charactersWithStatus[i]
                const estado = c.ownerName ? `Reclamado por ${c.ownerName}` : "Libre"
                const valor = (c.buy || 0).toLocaleString()
                text += `» *${c.name}* (${valor}) • ${estado}\n`
            }

            text += `\n> ⌦ _Página *${page}* de *${totalPages}*_`
            if (totalPages > 1 && page < totalPages) {
                text += `\n⌦ usa *${usedPrefix + command} ${bestSeries} page=${page + 1}* para ver la siguiente Página.`
            }

            await conn.reply(m.chat, text, m)
        } catch (err) {
            console.error(err)
            await m.reply(`⚠︎ Se ha producido un problema.\n\n${err.message}`)
        }
    }
}

export default ainfoCommand;
