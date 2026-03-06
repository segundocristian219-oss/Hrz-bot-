import ImageKit from "imagekit"
import fetch from "node-fetch"

const imagekit = new ImageKit({
    publicKey: "public_UilqC3N3XUQp2rRJcGGhLhaXKSY=",
    privateKey: "private_ojSXwbW+qGniUaMFMzzVNWhiuI8=",
    urlEndpoint: "https://ik.imagekit.io/pm10ywrf6f"
})

const uploadCommand = {
    name: 'upload',
    alias: ['tourl', 'ik'],
    category: 'tools',
    run: async (m, { conn, command }) => {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!mime) return m.reply(`> ✰⋆͙̈ Responde a una imagen o video con el comando ➠ *${command}*`)

        await m.react('🕒')

        try {
            let media = await q.download()
            let fileName = `${Date.now()}.${mime.split('/')[1]}`

            imagekit.upload({
                file: media,
                fileName: fileName,
                folder: `/bot_by_voker`
            }, async (err, result) => {
                if (err) {
                    await m.react('❌')
                    return m.reply('*LOG:* ' + err.message)
                }

                const miDominio = "https://api.dix.lat"
                const rutaLimpia = result.url.replace("https://ik.imagekit.io/pm10ywrf6f", "")
                const finalUrl = `${miDominio}/media${rutaLimpia}`

                let txt = `*── 「 VOKER DRIVE 」 ──*\n\n`
                txt += `▢ *ID:* ${result.fileId}\n`
                txt += `▢ *NAME:* ${result.name}\n`
                txt += `▢ *URL:* ${finalUrl}\n`
                txt += `▢ *TIPO:* ${result.fileType}\n\n`
                txt += `> *Powered by Voker Systems*`

                await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
                await m.react('✅')
            })
        } catch (e) {
            await m.react('❌')
            m.reply("*ERROR:* No se pudo procesar el archivo.")
        }
    }
}

export default uploadCommand
