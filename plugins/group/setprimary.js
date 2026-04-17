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

    if (chat.backupBots?.length) {
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
    category: 'config',
    admin: true,
    group: true,

    run: async function (m, { conn, isOwner }) {
        try {

            /*
            if (!isOwner) return m.reply('Solo owners.')
            */

            const target = m.mentionedJid?.[0] || m.quoted?.sender
            if (!target) return m.reply('Menciona un bot.')

            const who = await getRealJid(target, conn, m.chat)

            const meta = await conn.groupMetadata(m.chat).catch(() => null)
            const users = meta?.participants?.map(p => p.id || p.jid) || []

            const main = conn.user.id.split(':')[0] + '@s.whatsapp.net'
            const bots = [...new Set([main, ...getBots()])]

            if (!bots.includes(who)) return m.reply('Bot inválido.')
            if (!users.includes(who)) return m.reply('No está en el grupo.')

            const backups = bots.filter(b => b !== who && users.includes(b))

            await global.Chat.findOneAndUpdate(
                { id: m.chat },
                { $set: { primaryBot: who, backupBots: backups } },
                { upsert: true }
            )

            await conn.sendMessage(m.chat, {
                text:
`❯❯ 𝗠𝗨𝗟𝗧𝗜 𝗕𝗢𝗧

❖ Principal:
@${who.split('@')[0]}

❖ Backups: ${backups.length}

✔ Fallback activo`,
                mentions: [who, ...backups]
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('Error.')
        }
    }
}

export default setprimary
