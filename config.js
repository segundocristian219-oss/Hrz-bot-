import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554', 'Eliac', true], ['50432569059']]

global.botNames = [
  'ɢᴜɪʟᴛʏ ᴄʀᴏᴡɴ — ᴠx',      
  '𝖦𝖴𝖨𝖫𝖳𝖸 𝖢𝖱𝖮𝖶𝖭 𝖵𝖷',      
  '𝐆𝐔𝐈𝐋𝐓𝐘 𝐂𝐑𝐎𝐖𝐍 𝐕𝐗',      
  'ＧＵＩＬＴＹ ＣＲＯＷＮ ＶＸ',  
  '⧫ ᴠᴏɪᴅ ɢᴇɴᴏᴍᴇ ⧫',   
  '⌬ ᴀᴘᴏᴄᴀʟʏᴘsᴇ ᴠx ⌬'       
]

global.botImages = [ 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830797656_735ec22d06753956aca8872c55c24368_EeBjc84my.jpg',  'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830818259_9d44b99d4d0952f51bf52fdb2c05986e_Xps4LJO8r.jpg', 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830821110_c20a3c37f4bd68fef7d7fb44d65303db_wVW7oX9KD.jpg', 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830823123_e336030d2dfd15b3f2a9bec8d30e15f3_YZEsD9KKM.jpg', 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830825552_79bf9a7935e94394d716bf6dd5b20f47_OQ4Crquzs.jpg' ]

global.api_endpoints = {
    a: "aHR0cHM6Ly9zbWFzaGEuYWx5YWJvdC54eXovZG93bmxvYWRfYXVkaW8=",
    v: "aHR0cHM6Ly9zbWFzaGEuYWx5YWJvdC54eXovZG93bmxvYWRfdmlkZW8="
};

const conf = {
  utils: {
    cheerio,
    fs,
    fetch,
    axios,
    moment
  },
  api: {
    url: 'https://api.deylin.xyz',
    key: 'dk_ofical_user'
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

const hour = new Date().getHours()
global.saludo = hour < 12 ? 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅' : hour < 18 ? 'Lɪɴᴅᴀ T Tᴀʀᴅᴇ 🌆' : 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})

