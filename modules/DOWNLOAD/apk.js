import axios from 'axios'
import fetch from 'node-fetch'

export const apkDownloadModule = {
    category: 'descargas',
    commands: {
        apk: {
            name: 'apk',
            alias: ['modapk', 'fdroid'],
            run: async (m, { conn, args }) => {
                const text = args.join(' ')
                if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese el nombre de la APK.*' }, { quoted: m })

                try {
                    await m.react('⏳')

                    const response = await axios.post('https://ryzecodes.xyz/api/scrapers/64/run', {
                        input: {
                            query: text,
                            limit: 5
                        }
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': 'ryzkyeqs'
                        }
                    })

                    if (!response.data.success || !response.data.result || !response.data.result.status || response.data.result.results.length === 0) {
                        await m.react('❌')
                        return conn.sendMessage(m.chat, { text: '*[!] No se encontraron resultados para la APK.*' }, { quoted: m })
                    }

                    const data = response.data.result.results[0]
                    const resThumb = await fetch(data.icon)
                    const thumbBuffer = Buffer.from(await resThumb.arrayBuffer())

                    let txt = `┏━━━━━━━━━━━━━━━━☒\n`
                    txt += `┇➙ *❒ APTOIDE - DOWNLOADER*\n`
                    txt += `┣━━━━━━━━━━━━━━━━⚄\n`
                    txt += `┋➙ *Nombre:* ${data.name}\n`
                    txt += `┋➙ *Paquete:* ${data.package}\n`
                    txt += `┋➙ *Tamaño:* ${(data.size / (1024 * 1024)).toFixed(2)} MB\n`
                    txt += `┋➙ *Desarrollador:* ${data.developer}\n`
                    txt += `┗━━━━━━━━━━━━━━━━⍰`

                    await conn.sendMessage(m.chat, {
                        document: { url: data.download_url },
                        mimetype: 'application/vnd.android.package-archive',
                        fileName: `${data.name}.apk`,
                        caption: txt,
                        contextInfo: {
                            externalAdReply: {
                                title: data.name,
                                body: 'Click para instalar APK',
                                thumbnail: thumbBuffer,
                                sourceUrl: data.download_url,
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
    }
}
