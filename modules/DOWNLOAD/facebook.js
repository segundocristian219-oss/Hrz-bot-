import fetch from 'node-fetch'

export const facebookDownloadModule = {
    category: 'descargas',
    commands: {
        facebook: {
            name: 'facebook',
            alias: ['fb', 'fbdl'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                if (!args[0]) return m.reply(`*⍰ Ingresa un enlace de Facebook...*`)

                const regexFacebook = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch|fb\.gg)\/[^\s]+$/i
                if (!regexFacebook.test(args[0])) return m.reply(`*ஐ Enlace de Facebook no válido.*`)

                try {
                    if (m.react) await m.react("⏳")

                    const response = await fetch('https://panel.apinexus.fun/api/facebook/descargar', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'x-api-key': global.key // Corregido para usar la key global de tu config.js
                        },
                        body: JSON.stringify({ url: args[0] })
                    })

                    const json = await response.json()

                    if (!json.success || !json.data) throw new Error("No data found")

                    const { titulo, hd, sd, media, type } = json.data

                    if (type === 'image' || (media && media.length > 0 && !hd && !sd)) {
                        const images = media || [json.data.url]
                        for (const imgUrl of images) {
                            await conn.sendMessage(m.chat, { image: { url: imgUrl }, caption: titulo || '' }, { quoted: m })
                        }
                        if (m.react) await m.react("✅")
                        return
                    }

                    const videoUrl = hd || sd
                    const quality = hd ? "720p (HD)" : "SD"

                    const caption = `\t\t\t 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n> ღ *Título:* ${titulo || "Video de Facebook"}\n> ✰ *Calidad:* ${quality}\n> ✎ *Enlace:* ${args[0]}\n\n`

                    const videoRes = await fetch(videoUrl)
                    const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
                    const sizeMB = videoBuffer.length / (1024 * 1024)

                    if (sizeMB > 80) {
                        await conn.sendMessage(m.chat, { 
                            document: videoBuffer, 
                            caption: caption,
                            fileName: `fb_video.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m })
                    } else {
                        await conn.sendMessage(m.chat, { 
                            video: videoBuffer, 
                            caption: caption,
                            fileName: `fb_video.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m })
                    }

                    if (m.react) await m.react("✅")

                } catch (e) {
                    console.error(e)
                    if (m.react) await m.react("❌")
                    m.reply("卍 Error al procesar Facebook. El video podría ser privado o el enlace ha expirado.\n\nUsa el comando *#report* para reportar este error.")
                }
            }
        }
    }
}
