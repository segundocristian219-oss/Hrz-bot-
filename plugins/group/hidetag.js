const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notificar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, participants }) => {
        const users = participants.map(u => u.id)
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        const tagText = text || q.text || ''

        try {
            if (mime) {
                const media = await q.download()
                const type = mime.split('/')[0]
                
                await conn.sendMessage(m.chat, {
                    [type === 'sticker' ? 'sticker' : type]: media,
                    caption: type === 'sticker' ? undefined : tagText,
                    mentions: users,
                    contextInfo: { 
                        mentionedJid: users,
                        isForwarded: true,
                        forwardingScore: 999,
                        businessOwnerJid: '50433191934@s.whatsapp.net'
                    }
                }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { 
                    text: tagText || 'Notificación General', 
                    mentions: users,
                    contextInfo: { 
                        mentionedJid: users,
                        externalAdReply: {
                            title: 'SISTEMA DE NOTIFICACIONES',
                            body: 'Deylin Dev Official',
                            thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771123381140_9u4BT8HVp.jpeg',
                            mediaType: 1,
                            showAdAttribution: true,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m })
            }
            await m.react('✅')
        } catch (e) {
            await conn.sendMessage(m.chat, { text: tagText || 'Error en Notificación', mentions: users })
        }
    }
}

export default hidetagCommand
