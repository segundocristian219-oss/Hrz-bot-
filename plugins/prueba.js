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
            
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            })

            const $ = cheerio.load(data)
            const results = []

            $('article.post-item').each((i, el) => {
                const url = $(el).find('a.exopop').attr('href')
                const title = $(el).find('.post-title span').text().trim()
                const thumb = $(el).find('img').attr('src')
                if (url) results.push({ title, url, thumb })
            })

            if (results.length === 0) return m.reply('No results.')

            const random = results[Math.floor(Math.random() * results.length)]

            const { data: pageData } = await axios.get(random.url)
            const $$ = cheerio.load(pageData)
            
            const gifUrl = $$('.single-post-media img').attr('src')

            if (!gifUrl) return m.reply('GIF not found.')

            await conn.sendMessage(m.chat, {
                video: { url: gifUrl },
                caption: `*HGIF*\n*Title:* ${random.title}`,
                gifPlayback: true,
                contextInfo: {
                    externalAdReply: {
                        title: 'Hentai GIF System',
                        body: random.title,
                        thumbnailUrl: random.thumb,
                        sourceUrl: random.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

        } catch (e) {
            m.reply('Error occurred.')
        }
    }
}

export default handler
