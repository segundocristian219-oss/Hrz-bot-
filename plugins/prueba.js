import axios from 'axios'
import * as cheerio from 'cheerio'

const handler = {
    name: 'hgif',
    alias: ['hentaigif'],
    category: 'nsfw',
    run: async (m, { conn, text }) => {
        try {
            const query = text ? encodeURIComponent(text) : 'fuck+anime'
            const searchUrl = `https://hentaigifz.com/?s=${query}`
            
            const { data: searchData } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })

            const $ = cheerio.load(searchData)
            const results = []

            $('article.post-item').each((i, el) => {
                const url = $(el).find('a.exopop').attr('href')
                const title = $(el).find('.post-title span').text().trim()
                if (url) results.push({ title, url })
            })

            if (results.length === 0) return m.reply('No se encontraron resultados.')

            const random = results[Math.floor(Math.random() * results.length)]

            const { data: pageData } = await axios.get(random.url)
            const $$ = cheerio.load(pageData)
            
            let videoUrl = $$('source[type="video/mp4"]').attr('src') || $$('video').attr('src') || $$('.single-post-media img').attr('src')

            if (!videoUrl) return m.reply('No se pudo localizar el archivo MP4/GIF.')

            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' })
            const buffer = Buffer.from(response.data, 'binary')

            await conn.sendMessage(m.chat, {
                video: buffer,
                caption: `*Resultado:* ${random.title}\n*URL Directa:* ${videoUrl}`,
                gifPlayback: true
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('Error al procesar la descarga.')
        }
    }
}

export default handler
