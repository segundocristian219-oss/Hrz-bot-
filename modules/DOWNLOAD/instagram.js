import fetch from 'node-fetch'

export const instagramDownloadModule = {
    category: 'descargas',
    commands: {
        instagram: {
            name: 'instagram',
            alias: ['ig', 'reels', 'reel'],
            run: async (m, { conn, args }) => {
                if (!args[0]) return m.reply(`*✰ Ingresa un enlace de Instagram.*`)

                const regexInstagram = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reels|reel|tv)\/[^\s]+$/i
                if (!regexInstagram.test(args[0])) return m.reply(`*ஐ Enlace no válido.*`)

                try {
                    if (m.react) await m.react("⏳")

                    const res = await fetch(`https://sylphyy.xyz/download/instagram?url=${encodeURIComponent(args[0])}&api_key=sylphy-hz8pNip`)
                    const json = await res.json()

                    if (!json.status || !json.result?.length) throw new Error("No data")

                    const video = json.result.find(url => url.includes('.mp4')) || json.result[1]

                    if (!video) throw new Error("No video found")

                    const caption = `\t\t\t*INSTAGRAM DOWNLOADER*\n\n> ム *Tipo:* Post/Reel\n> ღ *Link:* ${args[0]}\n`

                    await conn.sendMessage(m.chat, { 
                        video: { url: video }, 
                        caption: caption 
                    }, { quoted: m })

                    if (m.react) await m.react("✅")
                } catch (e) {
                    console.error(e)
                    if (m.react) await m.react("❌")
                    m.reply(`⍰ Error al procesar Instagram.\n\nUsa el comando *#report* para reportar este error.`)
                }
            }
        }
    }
}
