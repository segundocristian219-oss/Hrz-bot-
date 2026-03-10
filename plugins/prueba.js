import axios from 'axios'
import FormData from 'form-data'

const videoAiCommand = {
    name: 'genvideo',
    alias: ['text2video', 'iavideo', 'voker'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return conn.reply(m.chat, `『 ⛔ 』Ingresa un texto para generar el video.\n\nEjemplo:\n*${usedPrefix + command}* un gato astronauta en marte`, m)

        await m.react('⏳')

        const setup = {
            cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
            shiftValue: 3,
            dec(text, shift) {
                return [...text].map(c => /[a-z]/.test(c)
                    ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
                    : /[A-Z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
                        : c).join('')
            }
        }

        const token = setup.dec(setup.cipher, setup.shiftValue)
        const deviceID = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        
        const headers = {
            'user-agent': 'NB Android/1.0.0',
            'accept-encoding': 'gzip',
            'content-type': 'application/json',
            'authorization': token
        }

        try {
            // Paso 1: Solicitar generación
            const genUrl = 'https://text2video.aritek.app/txt2videov3'
            const payload = { deviceID, isPremium: 1, prompt: text, used: [], versionCode: 59 }
            
            const resGen = await axios.post(genUrl, payload, { headers })
            const { code, key } = resGen.data

            if (code !== 0 || !key) throw new Error('No se pudo obtener la llave de generación.')

            // Paso 2: Polling (Esperar el video)
            const videoUrl = 'https://text2video.aritek.app/video'
            let finalVideo = null
            let attempts = 0
            const maxAttempts = 30

            while (attempts < maxAttempts) {
                attempts++
                const resVideo = await axios.post(videoUrl, { keys: [key] }, { headers })
                const { code: vCode, datas } = resVideo.data

                if (vCode === 0 && datas?.length > 0 && datas[0].url) {
                    finalVideo = datas[0].url.trim()
                    break
                }
                
                await new Promise(r => setTimeout(r, 4000)) // Esperar 4 segundos entre intentos
            }

            if (!finalVideo) throw new Error('Tiempo de espera agotado o video no generado.')

            let txt = `┏━━━━━━━◥◣◆◢◤━━━━━━━┓\n`
            txt += `┃     ❖ 𝗔𝗜 𝗩𝗜𝗗𝗘𝗢 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥 ❖\n`
            txt += `┣━━━━━━━━━━━━━━━━━━━━━\n`
            txt += `┃ ▷ 𝗣𝗿𝗼𝗺𝗽𝘁: ${text}\n`
            txt += `┃ ▷ 𝗘𝘀𝘁𝗮𝗱𝗼: Completado ✅\n`
            txt += `┃ ▷ 𝗜𝘁𝗲𝗿𝗮𝗰𝗶𝗼𝗻𝗲𝘀: ${attempts}\n`
            txt += `┗━━━━━━━◥◣◆◢◤━━━━━━━┛`

            await m.react('🎬')
            await conn.sendMessage(m.chat, { 
                video: { url: finalVideo }, 
                caption: txt 
            }, { quoted: m })

        } catch (err) {
            console.error(err)
            await m.react('✖')
            conn.reply(m.chat, `『 ✖ 』Error: ${err.message}`, m)
        }
    }
}

export default videoAiCommand
