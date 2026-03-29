import axios from 'axios'
import fetch from 'node-fetch'

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

            const response = await axios.get(`https://api.dix.lat/mediafire?url=${encodeURIComponent(text)}`)

            if (!response.data.status || !response.data.result) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se pudo obtener el archivo del enlace proporcionado.*' }, { quoted: m })
            }

            const data = response.data.result
            const isTooLarge = parseFloat(data.filesize) > 300 && data.filesize.includes('MB') || data.filesize.includes('GB')

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ MEDIAFIRE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data.filename}\n`
            txt += `┋➙ *Peso:* ${data.filesize}\n`
            txt += `┋➙ *Tipo:* ${data.filetype}\n`
            txt += `┋➙ *Subido:* ${data.uploaded}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            if (isTooLarge) {
                await m.react('⚠️')
                return conn.sendMessage(m.chat, { text: `${txt}\n\n*El archivo es demasiado pesado para enviarlo por WhatsApp.*` }, { quoted: m })
            }

            await conn.sendMessage(m.chat, {
                document: { url: data.download },
                mimetype: 'application/octet-stream',
                fileName: data.filename,
                caption: txt,
                contextInfo: {
                    externalAdReply: {
                        title: await global.name(conn),
                        body: `Archivo: ${data.filename}`,
                        thumbnailUrl: await global.img(conn),
                        sourceUrl: text,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: '*[!] Ocurrió un error interno al procesar la descarga.*' }, { quoted: m })
        }
    }
}

export default mediafireCommand
