import { gachaService } from '../lib/gachaService.js'
import fetch from 'node-fetch'

const wimageCommand = {
  name: 'wimage',
  alias: ['cimage', 'charimage', 'waifuimage'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat }) => {
    try {
      if (m.isGroup && (!chat || !chat.gacha)) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      if (!args.length) {
        return m.reply(`❀ Por favor, indica un personaje.\n> Ejemplo » *${usedPrefix + command} Marin Kitagawa*`)
      }

      const allCharacters = await gachaService.getAllCharacters()
      const query = args.join(' ').toLowerCase().trim()

      const character = allCharacters.find(c => 
        c.name.toLowerCase() === query || 
        c.name.toLowerCase().includes(query)
      )

      if (!character) {
        return m.reply(`ꕥ No se encontró el personaje *${query}*.`)
      }

      const formatTag = (tag) => String(tag).trim().toLowerCase().replace(/\s+/g, '_')
      const tag = formatTag(character.name)

      const buscarImagen = async (tag) => {
        const urls = [
          `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}`,
          `https://danbooru.donmai.us/posts.json?tags=${tag}`,
          `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}&api_key=f965be362e70972902e69652a472b8b2df2c5d876cee2dc9aebc7d5935d128db98e9f30ea4f1a7d497e762f8a82f132da65bc4e56b6add0f6283eb9b16974a1a&user_id=1862243`
        ]
        for (const url of urls) {
          try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
            if (!res.ok) continue
            const json = await res.json()
            const data = Array.isArray(json) ? json : json?.post || json?.data || []
            const imgs = data.map(i => i?.file_url || i?.large_file_url || i?.image || i?.media_asset?.variants?.[0]?.url).filter(u => typeof u === 'string' && /^https?:\/\//i.test(u))
            if (imgs.length) return imgs
          } catch {}
        }
        return []
      }

      const images = await buscarImagen(tag)
      const image = images.length ? images[Math.floor(Math.random() * images.length)] : character.img

      const caption = `❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender || 'Desconocido'}*\n❖ Fuente » *${character.source}*`

      await conn.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m })

    } catch (e) {
      console.error(e)
      await m.reply(`⚠ Error inesperado:\n${e.message}`)
    }
  }
}

export default wimageCommand
