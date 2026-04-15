```js
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const delay = ms => new Promise(r => setTimeout(r, ms))
const format = n => Number(n).toLocaleString('de-DE')

global.$casino = global.$casino || {
locks: new Set(),
pvp: {},
market: [],
logs: []
}

const symbols = ["💀","🔔","💎","👑","🌠","7️⃣"]

let handler = async (m, { conn, args, usedPrefix, command }) => {
try {

let users = global.db.data.users
if (!users) global.db.data.users = {}

let settings = global.db.data.settings
if (!settings) global.db.data.settings = {}

if (!global.db.data.settings.casino) {
global.db.data.settings.casino = {
jackpot: 0,
mega: 0,
season: 1,
reset: Date.now() + 604800000
}
}

let casino = global.db.data.settings.casino

let user = users[m.sender]
if (!user) {
users[m.sender] = {
money: 1000,
exp: 0,
level: 1,
lastSlot: 0
}
user = users[m.sender]
}

if (typeof user.money !== 'number') user.money = 1000
if (typeof user.exp !== 'number') user.exp = 0
if (typeof user.level !== 'number') user.level = 1
if (typeof user.lastSlot !== 'number') user.lastSlot = 0

if (Date.now() > casino.reset) {
casino.season++
casino.reset = Date.now() + 604800000
}

let sub = (args[0] || '').toLowerCase()

if (sub === 'top') {
let top = Object.entries(users)
.sort((a,b)=> (b[1].money||0) - (a[1].money||0))
.slice(0,5)

let txt = top.map((x,i)=>`${i+1}. ${x[0].split('@')[0]} ${format(x[1].money||0)}`).join('\n')
return m.reply(txt)
}

let amount = args[0] === 'all'
? user.money
: parseInt(args[0])

if (!amount || isNaN(amount) || amount <= 0)
return m.reply(`Uso: ${usedPrefix + command} <cantidad>`)

if (user.money < amount)
return m.reply("No tienes suficiente dinero")

if (Date.now() - user.lastSlot < 3000)
return m.reply("Espera 3 segundos")

if (global.$casino.locks.has(m.sender))
return m.reply("Procesando...")

global.$casino.locks.add(m.sender)

user.lastSlot = Date.now()

casino.jackpot += Math.floor(amount * 0.1)
casino.mega += Math.floor(amount * 0.05)

const roll = () => symbols[Math.floor(Math.random()*symbols.length)]

let r1 = roll()
let r2 = roll()
let r3 = roll()

const { key } = await conn.sendMessage(m.chat, { text: `[ 🌀 | 🌀 | 🌀 ]` }, { quoted: m })

await delay(300)
await conn.sendMessage(m.chat,{text:`[ ${roll()} | 🌀 | 🌀 ]`,edit:key})

await delay(300)
await conn.sendMessage(m.chat,{text:`[ ${r1} | ${roll()} | 🌀 ]`,edit:key})

await delay(400)
await conn.sendMessage(m.chat,{text:`[ ${r1} | ${r2} | ${r3} ]`,edit:key})

let triple = r1===r2 && r2===r3
let double = r1===r2 || r2===r3 || r1===r3

let result = 0
let status = "LOSE"

if (triple) {
if (Math.random() < 0.01) {
result = casino.mega
casino.mega = 0
status = "MEGA JACKPOT"
} else if (Math.random() < 0.05) {
result = casino.jackpot
casino.jackpot = 0
status = "JACKPOT"
} else {
result = amount * 5
status = "WIN"
}
} else if (double) {
result = amount * 2
status = "OK"
} else {
result = -amount
}

user.money += result
if (user.money < 0) user.money = 0

user.exp += Math.floor(amount / 10)

if (user.exp >= user.level * 100) {
user.exp = 0
user.level++
}

let txt = `
[ ${r1} | ${r2} | ${r3} ]
${status}
${result > 0 ? '+' : ''}${format(result)}
💰 ${format(user.money)}
🎰 ${format(casino.jackpot)}
🌋 ${format(casino.mega)}
🏆 Nivel ${user.level}
`.trim()

await delay(300)
await conn.sendMessage(m.chat, { text: txt, edit: key })

global.$casino.locks.delete(m.sender)

} catch (e) {
console.error(e)
global.$casino.locks.delete(m.sender)
await m.reply("Error en slot")
}
}

handler.help = ['slot <cantidad>']
handler.tags = ['game']
handler.command = ['slot','casino']

export default handler
```
