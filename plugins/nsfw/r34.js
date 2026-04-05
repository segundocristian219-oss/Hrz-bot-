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
      const tag = text
      let mediaList = []
      const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${tag}&user_id=5267539&api_key=dc12e2cb36b1bab5e941e7024bd2ac35dcdc9285bc047a4c99921bbfbc8ce5320b7f874de7e7e9ac23781ff9414f2cea88cb2e2cda77bfc36975576dc0fede0a`
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
      const type = res.headers.get('content-type') || ''
      if (res.ok && type.includes('json')) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json?.post || json?.data || []
        const valid = data.map(i => i?.file_url || i?.sample_url || i?.preview_url).filter(u => typeof u === 'string' && /\.(jpe?g|png|gif|mp4)$/i.test(u))
        if (valid.length) {
          mediaList = [...new Set(valid)].sort(() => Math.random() - 0.5)
        }
      }
      if (!mediaList.length) 
        return conn.reply(m.chat, `《✧》 No se encontraron resultados para ${tag}`, m)
      const media = mediaList[0]
      const caption = `✰ Resultados para » ${tag}\n➠ TAGS: ${data.tags[1]}`
      if (media.endsWith('.mp4')) {
        await conn.sendMessage(m.chat, { video: { url: media }, caption, mentions: [m.sender] })
      } else {
        await conn.sendMessage(m.chat, { image: { url: media }, caption, mentions: [m.sender] })
      }
      await m.react('✔️')
    } catch (e) {
      await m.react('✖️')
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
}


export default r34