import axios from 'axios'
import * as cheerio from 'cheerio'

const handler = {
    name: 'hgif',
    alias: ['hentaigif', 'hvideo'],
    category: 'nsfw',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el estilo o categoría (ej: fuck, solo, creampie).')

        try {
            await m.react('🔘')
            
            const searchUrl = `https://hentaigifz.com/tag/${text.toLowerCase().replace(/\s+/g, '-')}/`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            })

            const $ = cheerio.load(data)
            const results = []

            $('article.post').each((i, el) => {
                const title = $(el).find('h2.entry-title a').text().trim()
                const url = $(el).find('h2.entry-title a').attr('href')
                const thumbnail = $(el).find('img').attr('src') || $(el).find('img').attr('data-src')

                if (url && thumbnail) {
                    results.push({ title, url, thumbnail })
                }
            })

            if (results.length === 0) return m.reply('No se encontraron resultados para ese estilo.')

            const random = results[Math.floor(Math.random() * results.length)]

            const { data: pageData } = await axios.get(random.url)
            const $$ = cheerio.load(pageData)
            const gifUrl = $$('div.entry-content img').attr('src') || $$('div.entry-content video source').attr('src')

            if (!gifUrl) return m.reply('Error al extraer el archivo multimedia.')

            await conn.sendMessage(m.chat, {
                video: { url: gifUrl },
                caption: `*HGIF ANALYST*\n\n*Título:* ${random.title}\n*Estilo:* ${text}\n*Origen:* HentaiGifz`,
                gifPlayback: true,
                contextInfo: {
                    externalAdReply: {
                        title: 'NSFW CONTENT SYSTEM',
                        body: 'HentaiGifz Scraper',
                        thumbnailUrl: random.thumbnail,
                        sourceUrl: random.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            m.reply('Error: Categoría no encontrada o falla en el servidor.')
        }
    }
}

export default handler
