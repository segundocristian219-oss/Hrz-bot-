import axios from 'axios'

const mediafireCommand = {
    name: 'mediafire',
    alias: ['mf', 'dlmf'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const url = args[0]
        if (!url) return conn.sendMessage(m.chat, { text: '*[!] Ingrese un enlace válido de MediaFire.*' }, { quoted: m })
        
        try {
            await m.react('⏳')

            const { data: res } = await axios.get(`https://api.dix.lat/mediafire?url=${encodeURIComponent(url)}`)

            if (!res.status || !res.result) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se pudo obtener el enlace de descarga directo.*' }, { quoted: m })
            }

            const { filename, filesize, download } = res.result
            
            const bName = await global.name(conn)
            const bImg = await global.img(conn)

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ MEDIAFIRE - APK*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Archivo:* ${filename}\n`
            txt += `┋➙ *Peso:* ${filesize}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            await conn.sendMessage(m.chat, {
                document: { url: download },
                mimetype: 'application/vnd.android.package-archive',
                fileName: filename.toLowerCase().endsWith('.apk') ? filename : `${filename}.apk`,
                caption: txt,
                contextInfo: {
                    externalAdReply: {
                        title: bName,
                        body: `Descarga de MediaFire (${filesize})`,
                        thumbnailUrl: bImg,
                        sourceUrl: url,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: `*[!] Error al procesar el APK:* ${e.message}` }, { quoted: m })
        }
    }
}

export default mediafireCommand
