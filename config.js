import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554'], ['157449910792287@lid'], ['155968113483985@lid'], ['50432569059'], ['50582908110'], ['584228028583']]

global.bots_free = ['50488198573']


global.botNames = [
  '𝐊𝐈𝐑𝐈𝐓𝐎 ♛',       
  '𝒌𝒂𝒛𝒖𝒕𝒐 𝒌𝒊𝒓𝒊𝒈𝒂𝒚 ✰', 
  '⧫ ᴋɪʀɪᴛᴏ - ᴋᴀᴢᴜᴛᴏ ᴋɪʀɪɢᴀʏ ⧫',   
  '⌬ 🄺🄸🅁🄸🅃🄾 ⌬'       
]


global.botImages = [ 'https://api.dix.lat/media2/1773637281084.jpg',
'https://api.dix.lat/media2/1773637276760.jpg',
'https://api.dix.lat/media2/1773637265253.jpg',
'https://api.dix.lat/media2/1773637270663.jpg',
'https://api.dix.lat/media2/1773637244306.jpg']

global.botImages2 = [ 'https://api.dix.lat/media2/1773638458604.jpg',
'https://api.dix.lat/media2/1773638453930.jpg',
'https://api.dix.lat/media2/1773638443955.jpg',
'https://api.dix.lat/media2/1773638448409.jpg',
'https://api.dix.lat/media2/1773638462741.jpg',
'https://api.dix.lat/media2/1773638468052.jpg']

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
global.ch = conf.social.channel
global.rmr = more.repeat(850)
global.developer = '𝙳𝚎𝚢𝚕𝚒𝚗 𝙴𝚕𝚒𝚊𝚌'
global.name = () => global.botNames[Math.floor(Math.random() * global.botNames.length)]
global.img = () => global.botImages[Math.floor(Math.random() * global.botImages.length)]
global.img2 = () => global.botImages2[Math.floor(Math.random() * global.botImages2.length)]
global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version




global.tyket = (function() {
  const c1 = "dx_lat_0x7B";
  const c2 = "\u200B\u001B[38;5;214m\u2060\u200D\u200B\u200C";
  const c3 = "_Voker_Sys_00\u200B1.0.0_37080_159";
  const c4 = "_0x%02X\u200B\u200C\u2060_";
  const c5 = "%5B%22\u0024%7B0x00A0%7D\u221E\u2202\u2206%22%5D";
  const c6 = "_\u0020\u200B\u200D\u2060_0x7F";
  const c7 = String.fromCharCode(0, 1, 7, 8, 11, 12, 14, 15);
  const c8 = "_S3R14L1Z3R_0x0D\u200B\u200D\u2060_";
  const c9 = "%5B\u200B\u200C\u200B\u200C%5D_0x2026_03";
  const c10 = "_28_UTC_0x00";

  return c1.concat(c2, c3, c4, c5, c6, c7, c8, c9, c10);
})();





global.channelInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: ch, 
        newsletterName: name()
    }
};

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

