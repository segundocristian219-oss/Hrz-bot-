import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554'], ['50432569059']]

global.botNames = [
  'ɢᴜɪʟᴛʏ ᴄʀᴏᴡɴ — ᴠx',      
  '𝖦𝖴𝖨𝖫𝖳𝖸 𝖢𝖱𝖮𝖶𝖭 𝖵𝖷',      
  '𝐆𝐔𝐈𝐋𝐓𝐘 𝐂𝐑𝐎𝐖𝐍 𝐕𝐗',      
  'ＧＵＩＬＴＹ ＣＲＯＷＮ ＶＸ',  
  '⧫ ᴠᴏɪᴅ ɢᴇɴᴏᴍᴇ ⧫',   
  '⌬ ᴀᴘᴏᴄᴀʟʏᴘsᴇ ᴠx ⌬'       
]

global.botImages = [ 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482544090_b8c3881cd7221257817e375cd7283918_NorYLEcDgv.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482546371_5cb90b226cda01be4f9cd9dc0d1a2f54_98pFKQ1yF.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482547877_53235316261c8f750b4b18d860a4bfae_5JnvBVkoh.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482549626_c94e03ca0366250b9cd992212ce2cd2a_NO0OlKGK1L.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482551338_5baab5fe0420f3ef4e41ebf01d3f7c2c_HYkdcMVk2.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482552940_ff92f9e59231e37dff39c36b9c3e84dd_i-O-zUzR3H.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482554714_b23011009fb8df483b52a257f0c414a8_oXi_9P1Qq.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1772482556697_b7337a5a637b1e0865937d2dc3ca40ac_P39z6eYIA.jpg' ]

const conf = {
  utils: {
    cheerio,
    fs,
    fetch,
    axios,
    moment
  },
  api: {
    url: 'https://api.dix.lat',
    key: 'VOKER_FREE_2026'
  },
  sessions: {
    main: 'sessions',
    sub: 'sessions_sub_assistant'
  },
  social: {
    channel: '120363406846602793@newsletter'
  }
}
var more = String.fromCharCode(8206)
Object.assign(global, conf.utils)
global.url_api = conf.api.url
global.key = conf.api.key
global.sessions = conf.sessions.main
global.jadi = conf.sessions.sub
global.ch = { ch1: conf.social.channel }
global.rmr = more.repeat(850)
global.name = () => global.botNames[Math.floor(Math.random() * global.botNames.length)]
global.img = () => global.botImages[Math.floor(Math.random() * global.botImages.length)]
global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'User-Agent': 'GoogleBot'
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) {
    return null
  }
}


const d = new Date(new Date().getTime() + 3600000)
global.fecha = d.toLocaleDateString('es', { day: 'numeric', month: 'numeric', year: 'numeric' })
global.tiempo = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })

const hour = new Intl.DateTimeFormat('es-HN', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Tegucigalpa'
}).format(new Date());

global.saludo = hour >= 6 && hour < 12 ? 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅' : 
                 hour >= 12 && hour < 19 ? 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆' : 
                 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃';


let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})

