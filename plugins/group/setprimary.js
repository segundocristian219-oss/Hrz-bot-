import { getRealJid } from '../../lib/identifier.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getBots = () => {
    const folders = ['Subs', 'Mods']
    let bots = []

    for (const f of folders) {
        const dir = path.join(__dirname, '../../Sessions', f)
        if (!fs.existsSync(dir)) continue

        const list = fs.readdirSync(dir)
        for (const d of list) {
            const creds = path.join(dir, d, 'creds.json')
            if (fs.existsSync(creds)) {
                bots.push(d.replace(/\D/g, '') + '@s.whatsapp.net')
            }
        }
    }

    return bots
}

export const getActiveBot = async (conn, chatId) => {
    let chat = await global.Chat.findOne({ id: chatId })
    if (!chat) {
        chat = new global.Chat({ id: chatId })
        await chat.save()
    }

    const meta = await conn.groupMetadata(chatId).catch(() => null)
    const users = (meta?.participants || []).map(p => p.id || p.jid)

    const main = conn.user.id.split(':')[0] + '@s.whatsapp.net'
    const bots = [...new Set([main, ...getBots()])]

    const valid = (jid) => jid && bots.includes(jid) && users.includes(jid)

    if (valid(chat.primaryBot)) return chat.primaryBot

    if (Array.isArray(chat.backupBots)) {
        for (const b of chat.backupBots) {
            if (valid(b)) {
                chat.primaryBot = b
                await chat.save()
                return b
            }
        }
    }

    for (const b of bots) {
        if (valid(b)) {
            chat.primaryBot = b
            await chat.save()
            return b
        }
    }

    return main
}

const setprimary = {
    name: 'setprimary',
    alias: ['primary', 'mainbot'],
    category: 'group',
    admin: true,
    group: true,

    run: async (m, { conn, isOwner }) => {
        try {

            /*
            if (!isOwner) {
                return m.reply('✦ Solo el owner puede usar este comando.')
            }
            */

            const target = m.mentionedJid?.[0] || m.quoted?.sender
            if (!target) {
                return m.reply('✦ Menciona o responde a un bot.')
            }

            const who = await getRealJid(target, conn, m.chat)

            const meta = await conn.groupMetadata(m.chat).catch(() => null)
            const users = (meta?.participants || []).map(p => p.id || p.jid)

            const main = conn.user.id.split(':')[0] + '@s.whatsapp.net'
            const bots = [...new Set([main, ...getBots()])]

            if (!bots.includes(who)) {
                return m.reply('✖ Ese no es un bot válido.')
            }

            if (!users.includes(who)) {
                return m.reply('✖ Ese bot no está en el grupo.')
            }

            let chat = await global.Chat.findOne({ id: m.chat })
            if (!chat) {
                chat = new global.Chat({ id: m.chat })
            }

            const backups = bots.filter(b => b !== who && users.includes(b))

            chat.primaryBot = who
            chat.backupBots = backups

            await chat.save()

            await conn.sendMessage(m.chat, {
                text:
`╭─〔 🤖 MULTI BOT 〕─⬣
│
│ ✦ Principal:
│   @${who.split('@')[0]}
│
│ ✧ Backups: ${backups.length}
│
│ ✔ Reemplazo automático activo
│
╰────────────────⬣`,
                mentions: [who, ...backups]
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('✖ Error al configurar el bot.')
        }
    }
}

export default setprimary
