import axios from 'axios'

const mediafireCommand = {
    name: 'mediafire',
    alias: ['mf', 'dlmf'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const url = args[0]
        if (!url) return conn.sendMessage(m.chat, { text: '*[!] Ingrese un enlace válido.*' }, { quoted: m })

        try {
            await m.react('⏳')

            const { data: res } = await axios.get(`https://api.dix.lat/mediafire?url=${encodeURIComponent(url)}`)

            if (!res.status || !res.result) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] Error en la API.*' }, { quoted: m })
            }

            const { filename, filesize, download, uploaded, filetype } = res.result
            const ext = filename.split('.').pop().toLowerCase()

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ MEDIAFIRE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Archivo:* ${filename}\n`
            txt += `┋➙ *Subido:* ${uploaded}\n`
            txt += `┋➙ *Tipo:* ${filetype}\n`
            txt += `┋➙ *Peso:* ${filesize}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            
            const isVideo = ['mp4', 'mkv', 'mov', 'avi', '3gp'].includes(ext)
            const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext)

            if (isVideo) {
                await conn.sendMessage(m.chat, { 
                    video: { url: download }, 
                    caption: txt,
                    mimetype: 'video/mp4',
                    fileName: filename
                }, { quoted: m })
            } else if (isImage) {
                await conn.sendMessage(m.chat, { 
                    image: { url: download }, 
                    caption: txt 
                }, { quoted: m })
            } else {
                
                await conn.sendMessage(m.chat, {
                    document: { url: download },
                    mimetype: ext === 'apk' ? 'application/vnd.android.package-archive' : 'application/octet-stream',
                    fileName: filename,
                    caption: txt
                }, { quoted: m, uploadWithSpaces: true })
            }

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: `*[!] Error:* ${e.message}` }, { quoted: m })
        }
    }
}

export default mediafireCommand
