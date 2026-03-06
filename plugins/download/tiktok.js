import fetch from "node-fetch"

const tiktok = {
    name: 'tiktok',
    alias: ['tt', 'tiktok'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        if (!args[0]) return m.reply(`*ஐ Ingresa un enlace de TikTok.*`)

        try {
            await m.react("⏳")

            const res = await fetch(`${url_api}/tiktok?url=${encodeURIComponent(args[0])}&apikey=${key}`)
            const json = await res.json()

            if (!json.success || !json.data) throw new Error("API_ERROR")

            const data = json.data
            const videoUrl = data.reproducir || data.play || data.wmplay
            
            const formatter = new Intl.NumberFormat('es-ES')

            const caption = `\t\t\t*𝗧𝗜𝗞-𝗧𝗢𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦*

> ღ *Autor:* ${data.autor?.apodo || data.author?.nickname || 'Anónimo'}
> ✎ *Título:* ${data.title || 'Sin descripción'}
> ⍰ *Duración:* ${data.duración || data.duration || 0}s
> ♫ *Música:* ${data.music_info?.title || 'Original'}
> ×͜× *Creador:* ${data.music_info?.autor || '---'}
\t\t\t*ム ESTADÍSTICAS:*
> 𖤍 *Vistas:* ${formatter.format(data.recuento_de_reproducciones || data.play_count || 0)}
> ♡ *Likes:* ${formatter.format(data.recuento_de_digg || data.digg_count || 0)}
> ♛ *Comments:* ${formatter.format(data.Recuento_de_comentarios || data.comment_count || 0)}
> ★ *Shares:* ${formatter.format(data.Recuento_de_acciones || data.share_count || 0)}`

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl },
                caption: caption,
                fileName: `tiktok_voker.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: m })

            await m.react("✅")
        } catch (e) {
            console.error(e)
            await m.react("❌")
            m.reply("ஐ Error al procesar el enlace.")
        }
    }
}

export default tiktok
