import { getRealJid } from '../../lib/identifier.js'

const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notificar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text }) => {
        try {
            const cachedGroup = global.groupCache?.get(m.chat)
            let participants = []

            if (cachedGroup && cachedGroup.participants) {
                participants = cachedGroup.participants
            } else {
                const metadata = await conn.groupMetadata(m.chat).catch(() => null)
                if (!metadata) return
                participants = metadata.participants
                if (global.groupCache) global.groupCache.set(m.chat, metadata)
            }

            const rawUsers = participants.map(u => u.id)
            const realUsers = await Promise.all(rawUsers.map(jid => getRealJid(conn, jid, m)))
            
            const users = [...new Set([...rawUsers, ...realUsers])]

            const q = m.quoted ? m.quoted : m
            const mime = (q.msg || q).mimetype || ''
            const tagText = text || (m.quoted && m.quoted.text) || ""

            if (mime) {
                const media = await q.download()
                if (/webp/g.test(mime)) {
                    await conn.sendMessage(m.chat, { 
                        sticker: media, 
                        mentions: users 
                    }, { quoted: m })
                } else {
                    const type = mime.split('/')[0]
                    await conn.sendMessage(m.chat, {
                        [type]: media,
                        caption: tagText,
                        mentions: users 
                    }, { quoted: m })
                }
            } else {
                await conn.sendMessage(m.chat, { 
                    text: tagText || "Nᴏᴛɪғɪᴄᴀᴄɪóɴ Gᴇɴᴇʀᴀʟ", 
                    mentions: users 
                }, { quoted: m })
            }

            await m.react('✅')
        } catch (e) {
            await m.react('❌')
        }
    }
}

export default hidetagCommand
