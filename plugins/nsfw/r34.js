import fetch from 'node-fetch'

const r34 = {
  name: 'r34',
  alias: ['rule34', 'rule'],
  category: 'nsfw',
  nsfw: true,
  run: async (m, { conn, text, usedPrefix, command }) => {
    try {
      if (!text) return conn.reply(m.chat, `《✧》 Debes especificar tags para buscar\n> Ejemplo » *${usedPrefix + command} neko*`, m)      
      
      await m.react('🕒')
      
      const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${text}&user_id=5267539&api_key=dc12e2cb36b1bab5e941e7024bd2ac35dcdc9285bc047a4c99921bbfbc8ce5320b7f874de7e7e9ac23781ff9414f2cea88cb2e2cda77bfc36975576dc0fede0a`
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      })

      if (!res.ok) throw new Error('Error en la respuesta de la API')

      const json = await res.json()
      if (!json || json.length === 0) {
        await m.react('✖️')
        return conn.reply(m.chat, `《✧》 No se encontraron resultados para: ${text}`, m)
      }

      const target = json[Math.floor(Math.random() * json.length)]
      
      const media = target.file_url || target.sample_url
      const tags = target.tags || 'Sin tags disponibles'
      
      const caption = `*─── [ 🔞 RULE34 ] ───*\n\n` +
                      `*✰ Búsqueda:* ${text}\n` +
                      `*➠ Tags:* ${tags}\n\n` +
                      `_Resultado verificado correctamente._`

      if (media.includes('.mp4') || media.includes('.webm')) {
        await conn.sendMessage(m.chat, { video: { url: media }, caption, mentions: [m.sender] }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, { image: { url: media }, caption, mentions: [m.sender] }, { quoted: m })
      }

      await m.react('✔️')
      
    } catch (e) {
      console.error(e)
      await m.react('✖️')
      await m.reply(`> [Error: *${e.message}*]`)
    }
  }
}

export default r34
