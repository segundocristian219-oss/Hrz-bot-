const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notificar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, getGroupMetadata }) => {
        try {
            
            const groupMetadata = await getGroupMetadata(conn, m.chat)
            
            
            const participants = groupMetadata?.participants || []
            const users = participants.length > 0 ? participants.map(u => u.id) : []

            if (users.length === 0) return m.reply('> ╰❒ Error: No se detectaron miembros en la caché.')

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
            console.error(e)
            await m.react('❌')
        }
    }
}

export default hidetagCommand
