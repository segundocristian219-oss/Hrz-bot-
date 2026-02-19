import { gachaService } from '../lib/gachaService.js'

const winfoCommand = {
  name: 'winfo',
  alias: ['waifuinfo', 'charinfo'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix }) => {
    try {
      if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      if (!args.length) {
        return m.reply(`❀ Debes especificar un personaje.\n> Ejemplo » *${usedPrefix}winfo Kaede*`)
      }

      const searchName = args.join(" ").toLowerCase().trim()
      const allCharacters = await gachaService.getAllCharacters()

      const character = allCharacters.find(c => 
        c.name.toLowerCase() === searchName || 
        c.name.toLowerCase().includes(searchName)
      )

      if (!character) {
        return m.reply(`ꕥ No se encontró el personaje *${searchName}*.`)
      }

      const charId = String(character.id)
      const claim = await gachaService.getClaim(charId, m.chat)
      
      let ownerName = null
      if (claim) {
        ownerName = global.db.data.users[claim.owner_jid]?.name || await conn.getName(claim.owner_jid).catch(() => claim.owner_jid.split("@")[0])
      }

      const ranked = allCharacters
        .map(c => ({ id: String(c.id), value: Number(c.buy) || 0 }))
        .sort((a, b) => b.value - a.value)
      
      const position = ranked.findIndex(c => c.id === charId) + 1
      const estado = ownerName ? `Reclamado por ${ownerName}` : "Libre"

      const text = 
        `❀ Nombre » *${character.name}*\n` +
        `⚥ Género » *${character.gender || "Desconocido"}*\n` +
        `✰ Valor » *${(character.buy || 0).toLocaleString()}*\n` +
        `♡ Estado » *${estado}*\n` +
        `❖ Fuente » *${character.source}*\n` +
        `❏ Puesto » #${position}\n` +
        `ⴵ Votos globales » *${character.votes || 0}*`

      await conn.reply(m.chat, text, m, {
        mentions: claim ? [claim.owner_jid] : []
      })

    } catch (err) {
      console.error(err)
      await m.reply(`⚠︎ Se ha producido un problema.\n\n${err.message}`)
    }
  }
}

export default winfoCommand
