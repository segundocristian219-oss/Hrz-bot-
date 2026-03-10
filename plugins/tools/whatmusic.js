import acrcloud from 'acrcloud'
import fluent_ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'
import yts from 'yt-search'
import fetch from 'node-fetch'

const acr = new acrcloud({
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: 'c33c767d683f78bd17d4bd4991955d81',
  access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
})

const optimizeAudio = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)
        const chunks = []
        
        // Aquí fluent-ffmpeg usará el comando 'ffmpeg' global de tu sistema
        fluent_ffmpeg(stream)
            .toFormat('mp3')
            .audioChannels(1)
            .audioBitrate('64k')
            .duration(10)
            .on('error', (err) => {
                console.error('Error en FFmpeg:', err)
                reject(err)
            })
            .pipe()
            .on('data', chunk => chunks.push(chunk))
            .on('end', () => resolve(Buffer.concat(chunks)))
    })
}

const whatmusicCommand = {
    name: 'whatmusic',
    alias: ['shazam', 'repro', 'quemusica'],
    category: 'tools',
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || q.mediaType || ''

            if (!/video|audio/.test(mime)) {
                return conn.reply(m.chat, `『 ⛔ 』Menciona un audio o video para identificarlo.`, m)
            }

            await m.react('⏳')
            let buffer = await q.download()
            if (!buffer) return conn.reply(m.chat, '『 ✖ 』Fallo al descargar archivo.', m)

            const optimizedBuffer = await optimizeAudio(buffer).catch(() => buffer)
            let result = await acr.identify(optimizedBuffer)

            if (result.status.code !== 0) {
                await m.react('✖')
                return conn.reply(m.chat, `『 ✖ 』Sin resultados: ${result.status.msg}`, m)
            }

            const music = result.metadata.music[0]
            const { title, artists, album, genres, release_date, external_metadata } = music
            const ytId = external_metadata?.youtube?.vid

            let txt = `┏━━━━━━━◥◣◆◢◤━━━━━━━┓\n`
            txt += `┃   ❖ 𝗪𝗛𝗔𝗧𝗠𝗨𝗦𝗜𝗖 𝗜𝗗𝗘𝗡𝗧𝗜𝗧𝗬 ❖\n`
            txt += `┣━━━━━━━━━━━━━━━━━━━━━\n`
            txt += `┃ ▷ 𝗧𝗶𝘁𝘂𝗹𝗼: ${title || 'No detectado'}\n`
            txt += `┃ ▷ 𝗔𝗿𝘁𝗶𝘀𝘁𝗮: ${artists?.map(v => v.name).join(', ') || 'Desconocido'}\n`
            txt += `┃ ▷ 𝗔𝗹𝗯𝘂𝗺: ${album?.name || '---'}\n`
            txt += `┃ ▷ 𝗚𝗲𝗻𝗲𝗿𝗼: ${genres?.map(v => v.name).join(', ') || '---'}\n`
            txt += `┃ ▷ 𝗟𝗮𝗻𝘇𝗮𝗺𝗶𝗲𝗻𝘁𝗼: ${release_date || '---'}\n`

            let finalThumb = 'https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1768371970918_R3378XlQy.jpeg'
            
            if (ytId || title) {
                const query = ytId ? { videoId: ytId } : title
                const search = await yts(query).catch(() => null)
                const video = ytId ? search : (search?.videos ? search.videos[0] : null)

                if (video) {
                    txt += `┣━━━━━━━━━━━━━━━━━━━━━\n`
                    txt += `┃ ▷ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲: ${video.title}\n`
                    txt += `┃ ▷ 𝗖𝗮𝗻𝗮𝗹: ${video.author?.name || '---'}\n`
                    txt += `┃ ▷ 𝗩𝗶𝘀𝘁𝗮𝘀: ${video.views || '---'}\n`
                    txt += `┃ ▷ 𝗗𝘂𝗿𝗮𝗰𝗶𝗼𝗻: ${video.timestamp || '---'}\n`
                    txt += `┃ ▷ 𝗨𝗥𝗟: ${video.url}\n`
                    finalThumb = video.thumbnail
                }
            }
            txt += `┗━━━━━━━◥◣◆◢◤━━━━━━━┛`

            const resImg = await fetch(finalThumb)
            const thumbBuffer = Buffer.from(await resImg.arrayBuffer())

            await m.react('✅')
            await conn.sendMessage(m.chat, { 
                image: thumbBuffer, 
                caption: txt 
            }, { quoted: m })

        } catch (err) {
            console.error(err)
            await m.react('✖')
            conn.reply(m.chat, `『 ✖ 』Error interno: ${err.message}`, m)
        }
    }
}

export default whatmusicCommand
