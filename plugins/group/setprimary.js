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

        bots.push(...fs.readdirSync(dir)
            .filter(d => fs.existsSync(path.join(dir, d, 'creds.json')))
            .map(id => id.replace(/\D/g, '') + '@s.whatsapp.net'))
    }

    return bots
}

export const getActiveBot = async (conn, chatId) => {
    let chat = await global.Chat.findOne({ id: chatId }) || await global.Chat.create({ id: chatId })

    const meta = await conn.groupMetadata(chatId).catch(() => null)
    const users = meta?.participants?.map(p => p.id || p.jid) || []

    const main = conn.user.id.split(':')[0] + '@s.whatsapp.net'
    const bots = [...new Set([main, ...getBots()])]

    const valid = jid => jid && bots.includes(jid) && users.includes(jid)

    if (valid(chat.primaryBot)) {
        try {
            await conn.sendPresenceUpdate('available', chat.primaryBot)
            return chat.primaryBot
        } catch {}
    }

    if (Array.isArray(chat.backupBots)) {
        for (const b of chat.backupBots) {
            if (valid(b)) {
                await global.Chat.updateOne({ id: chatId }, { $set: { primaryBot: b } })
                return b
            }
        }
    }

    for (const b of bots) {
        if (valid(b)) {
            await global.Chat.updateOne({ id: chatId }, { $set: { primaryBot: b } })
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
                return m.reply(`✦ Menciona o responde a un bot.\n✧ Ejemplo: *.setprimary @bot*`)
            }

            const who = await getRealJid(target, conn, m.chat)

            const meta = await conn.groupMetadata(m.chat).catch(() => null)
            const users = meta?.participants?.map(p => p.id || p.jid) || []

            const main = conn.user.id.split(':')[0] + '@s.whatsapp.net'
            const bots = [...new Set([main, ...getBots()])]

            if (!bots.includes(who)) {
                return m.reply(`✖ Ese usuario no es un bot válido del sistema.`)
            }

            if (!users.includes(who)) {
                return m.reply(`✖ Ese bot no está dentro del grupo.`)
            }

            const backups = bots.filter(b => b !== who && users.includes(b))

            await global.Chat.findOneAndUpdate(
                { id: m.chat },
                { $set: { primaryBot: who, backupBots: backups } },
                { upsert: true }
            )

            await conn.sendMessage(m.chat, {
                text:
`╭─〔 🤖 𝗠𝗨𝗟𝗧𝗜 𝗕𝗢𝗧 〕─⬣
│
│ ✦ 𝗣𝗿𝗶𝗻𝗰𝗶𝗽𝗮𝗹:
│   @${who.split('@')[0]}
│
│ ✧ 𝗕𝗮𝗰𝗸𝘂𝗽𝘀: ${backups.length}
│
│ ✔ Sistema de reemplazo automático activo
│ ✔ Si el bot cae, otro tomará el control
│
╰────────────────⬣`,
                mentions: [who, ...backups]
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('✖ Error al configurar el bot principal.')
        }
    }
}

export default setprimary
