import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

const uploadDixCommand = {
    name: 'tourl',
    alias: ['upload', 'dix', 'subir'],
    category: 'tools',
    run: async (m, { conn, text, command }) => {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        
        if (!mime) return m.reply(`> ⚠️ Responde a un archivo multimedia con el comando: *${command} [ik|git]*`)

        const provider = (text || '').toLowerCase()
        let endpoint = ''
        let providerName = ''

        if (provider === 'ik' || provider === '1') {
            if (!mime.startsWith('image/')) return m.reply('> ❌ El proveedor *ImageKit (1)* solo acepta imágenes.')
            endpoint = 'https://deylin.xyz/api/upload1'
            providerName = 'IMAGEKIT'
        } else {
            endpoint = 'https://deylin.xyz/api/upload2'
            providerName = 'GITHUB CLOUD'
        }

        await m.react('🕒')

        try {
            let media = await q.download()
            let { ext } = await fileTypeFromBuffer(media) || { ext: 'bin' }

            const form = new FormData()
            form.append('file', media, { filename: `${Date.now()}.${ext}`, contentType: mime })

            const response = await axios.post(endpoint, form, {
                headers: {
                    ...form.getHeaders(),
                }
            })

            if (response.data.status) {
                const { url, size, id, mime: resMime } = response.data.data
                
                let txt = `*── 「 UPLOAD-DIX SYSTEM 」 ──*\n\n`
                txt += `▢ *ID:* ${id}\n`
                txt += `▢ *URL:* ${url}\n`
                txt += `▢ *PESO:* ${size}\n`
                txt += `▢ *MIME:* ${resMime}\n`
                txt += `▢ *PROVIDER:* ${providerName}\n\n`
                txt += `> *Powered by Voker Infrastructure*`

                await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
                await m.react('✅')
            } else {
                throw new Error(response.data.error)
            }
        } catch (e) {
            console.error(e)
            await m.react('❌')
            m.reply(`*ERROR CRÍTICO:* ${e.message}`)
        }
    }
}

export default uploadDixCommand
