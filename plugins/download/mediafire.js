import axios from 'axios'

const mediafireCommand = {
    name: 'mediafire',
    alias: ['mf', 'dlmf'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const text = args[0]
        if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese un enlace válido de MediaFire.*' }, { quoted: m })
        if (!/mediafire.com/i.test(text)) return conn.sendMessage(m.chat, { text: '*[!] El enlace no es de MediaFire.*' }, { quoted: m })

        try {
            await m.react('⏳')

            const response = await axios.get(`https://api.dix.lat/mediafire?url=${encodeURIComponent(text)}`).catch(() => null)

            if (!response || !response.data || !response.data.status) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se pudo obtener el archivo. La API no respondió correctamente.*' }, { quoted: m })
            }

            const data = response.data.result
            const sizeInMB = parseFloat(data.filesize.replace(/[^0-9.]/g, ''))
            const isGB = data.filesize.includes('GB')

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ MEDIAFIRE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data.filename}\n`
            txt += `┋➙ *Peso:* ${data.filesize}\n`
            txt += `┋➙ *Tipo:* ${data.filetype}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            if (isGB || sizeInMB > 900) {
                await m.react('⚠️')
                return conn.sendMessage(m.chat, { text: `${txt}\n\n*El archivo supera el límite de envío (900MB).*` }, { quoted: m })
            }

            const bName = await global.name(conn)
            const bImg = await global.img(conn)

            await conn.sendMessage(m.chat, {
                document: { url: data.download },
                mimetype: 'application/octet-stream',
                fileName: data.filename.endsWith('.7z') || data.filename.endsWith('.zip') ? data.filename : `${data.filename}.zip`,
                caption: txt,
                contextInfo: {
                    externalAdReply: {
                        title: bName,
                        body: `Descargando: ${data.filename}`,
                        thumbnailUrl: bImg,
                        sourceUrl: text,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: `*[!] Error:* ${e.message}` }, { quoted: m })
        }
    }
}

export default mediafireCommand
