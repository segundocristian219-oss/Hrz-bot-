let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, chat }) {
    if (!m.isGroup) return false
    if (!chat?.antiLink) return false
    if (isAdmin || isOwner || m.fromMe || isROwner) return false

    const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
    const isChannelForward = m?.msg?.contextInfo?.forwardedNewsletterMessageInfo

    if (isGroupLink || isChannelForward) {
        if (isGroupLink && isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
            if (m.text.includes(linkThisGroup)) return false
        }

        await conn.sendMessage(m.chat, { 
            text: `┏╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍⌬\n┃ *「 ENLACE DETECTADO 」*\n┃\n┃ @${m.sender.split('@')[0]} Rompiste las reglas.\n┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍⌬`, 
            mentions: [m.sender] 
        }, { quoted: m })

        if (!isBotAdmin) return false

        await new Promise(resolve => setTimeout(resolve, 1000))
        await conn.sendMessage(m.chat, { delete: m.key })
        await new Promise(resolve => setTimeout(resolve, 1000))
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        return true
    }
    return false
}

const message = {
    before
}

export default message
