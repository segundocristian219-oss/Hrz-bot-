import axios from 'axios'
import fetch from 'node-fetch'

const apkCommand = {
    name: 'apk',
    alias: ['modapk', 'fdroid'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const text = args.join(' ')
        if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese el nombre de la APK.*' }, { quoted: m })

        try {
            await m.react('⏳')

            const searchRes = await axios.get(`https://sylphy.xyz/search/fdroid?q=${encodeURIComponent(text)}&api_key=sylphy-Lg4rAtj`)
            
            if (!searchRes.data.status || !searchRes.data.result || searchRes.data.result.length === 0) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se encontraron resultados en F-Droid.*' }, { quoted: m })
            }

            const targetUrl = searchRes.data.result[0].url
            const downloadRes = await axios.get(`https://sylphy.xyz/download/fdroid?url=${encodeURIComponent(targetUrl)}&api_key=sylphy-Lg4rAtj`)

            if (!downloadRes.data.status || !downloadRes.data.result) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] Error al obtener los detalles de descarga.*' }, { quoted: m })
            }

            const data = downloadRes.data.result
            const resThumb = await fetch(data.icon)
            const thumbBuffer = Buffer.from(await resThumb.arrayBuffer())

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ F-DROID - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data.name}\n`
            txt += `┋➙ *Versión:* ${data.version}\n`
            txt += `┋➙ *Resumen:* ${data.summary}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            await conn.sendMessage(m.chat, {
                document: { url: data.apkUrl },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${data.name}.apk`,
                caption: txt,
                contextInfo: {
                    externalAdReply: {
                        title: data.name,
                        body: 'Click para instalar APK',
                        thumbnail: thumbBuffer,
                        sourceUrl: data.apkUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: e.message }, { quoted: m })
        }
    }
}

export default apkCommand
