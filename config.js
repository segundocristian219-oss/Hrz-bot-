/*

import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554'], ['584228028583']]



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




global.key = "kirito-bot-oficial"



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
*/



import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554'], ['584228028583']]

global.botNames = [
  '𝐊𝐈𝐑𝐈𝐓𝐎 ♛',       
  '𝒌𝒂𝒛𝒖𝒕𝒐 𝒌𝒊𝒓𝒊𝒈𝒂𝒚 ✰', 
  '⧫ ᴋɪʀɪᴛᴏ - ᴋᴀᴢᴜᴛᴏ ᴋɪʀɪɢᴀʏ ⧫',   
  '⌬ 🄺🄸🅁🄸🅃🄾 ⌬'       
]

global.botImages = [ 
  'https://api.dix.lat/media2/1773637281084.jpg',
  'https://api.dix.lat/media2/1773637276760.jpg',
  'https://api.dix.lat/media2/1773637265253.jpg',
  'https://api.dix.lat/media2/1773637270663.jpg',
  'https://api.dix.lat/media2/1773637244306.jpg'
]

global.botImages2 = [ 
  'https://api.dix.lat/media2/1773638458604.jpg',
  'https://api.dix.lat/media2/1773638453930.jpg',
  'https://api.dix.lat/media2/1773638443955.jpg',
  'https://api.dix.lat/media2/1773638448409.jpg',
  'https://api.dix.lat/media2/1773638462741.jpg',
  'https://api.dix.lat/media2/1773638468052.jpg'
]

const conf = {
  utils: { cheerio, fs, fetch, axios, moment },
  api: { url: 'https://api.dix.lat', key: 'VOKER_FREE_2026' },
  sessions: { main: 'sessions', sub: 'sessions_sub_assistant' },
  social: { channel: '120363406846602793@newsletter' }
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

global.name = (c) => {
  const connection = c || global.conn; // Si no pasas 'c', usa la conexión global del momento
  const id = connection?.user?.id?.split(':')[0] + '@s.whatsapp.net';
  
  if (connection?.settings?.botName) return connection.settings.botName;
  
  if (global.subbotConfig && global.subbotConfig[id]) {
    return global.subbotConfig[id].botName || global.botNames[0];
  }
  return global.botNames[Math.floor(Math.random() * global.botNames.length)];
};

global.img = (c) => {
  const connection = c || global.conn;
  const id = connection?.user?.id?.split(':')[0] + '@s.whatsapp.net';

  if (connection?.settings?.botImage) return connection.settings.botImage;

  if (global.subbotConfig && global.subbotConfig[id]) {
    return global.subbotConfig[id].botImage || global.botImages[0];
  }
  return global.botImages[Math.floor(Math.random() * global.botImages.length)];
};

global.img2 = (c) => {
  const connection = c || global.conn;
  const id = connection?.user?.id?.split(':')[0] + '@s.whatsapp.net';

  if (connection?.settings?.botImage) return connection.settings.botImage;

  if (global.subbotConfig && global.subbotConfig[id]) {
    return global.subbotConfig[id].botImage || global.botImages2[0];
  }
  return global.botImages2[Math.floor(Math.random() * global.botImages2.length)];
};


global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version
global.key = "kirito-bot-oficial"

global.channelInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: ch, 
        newsletterName: 'KIRITO CHANNEL' 
    }
};

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: "get",
      url,
      headers: { 'DNT': 1, 'User-Agent': 'GoogleBot' },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) { return null }
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

