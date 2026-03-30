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
            
            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ MEDIAFIRE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Archivo:* ${filename}\n`
            txt += `┋➙ *Peso:* ${filesize}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            await conn.sendMessage(m.chat, {
                document: { url: download }, 
                mimetype: 'application/octet-stream', 
                fileName: filename,
                caption: txt
            }, { 
                quoted: m,
                uploadWithSpaces: true,
                stream: true 
            })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: `*[!] Error al procesar el archivo:* ${e.message}` }, { quoted: m })
        }
    }
}

export default mediafireCommand
