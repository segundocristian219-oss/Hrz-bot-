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
  const _0x01 = String.fromCharCode(100, 120, 95, 108, 97, 116, 95, 48, 120, 55, 66);
  const _0x02 = "\u200B\u001B" + "[38;5;214m\u2060\u200D\u200B\u200C";
  const _0x03 = (function(s){ return s.split('').reverse().join(''); })("X20%x0_951_08073_0.0.1\u200B00_syS_rekoV_");
  const _0x04 = "\u200B\u200C\u2060";
  const _0x05 = [0x5f, 0x25, 0x35, 0x42, 0x25, 0x32, 0x32].map(x => String.fromCharCode(x)).join('');
  const _0x06 = "\u0024\u007B0x00A0\u007D\u221E\u2202\u2206%22%5D";
  const _0x07 = "_\u0020\u200B\u200D\u2060_0x7F";
  const _0x08 = String.fromCharCode(0x00, 0x01, 0x07, 0x08, 0x0B, 0x0C, 0x0E, 0x0F);
  const _0x09 = "_S3R14L1Z3R_0x0D\u200B\u200D\u2060_%5B\u200B\u200C\u200B\u200C%5D";
  const _0x0A = "_0x2026_03_28_UTC_0x00";

  const _0xFinal = [
    _0x01, _0x02, 
    (function(s){ return s.split('').reverse().join(''); })(_0x03), 
    _0x04, _0x05, _0x06, _0x07, _0x08, _0x09, _0x0A
  ].join('');

  return _0xFinal;
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

