import axios from 'axios'

const reaction = {
    emoji: '💦',
    txt_solo: '> ❒ @user1 quiere leche 🍆💦',
    txt_mencion: '> ❏ @user1 le está dando leche a @user2 🍆💦',
    links: [
'https://api.dix.lat/media2/1775344708817.mp4',
'https://api.dix.lat/media2/1775417254779.mp4',
'https://api.dix.lat/media2/1775417252117.mp4'
]
}

const cum = {
    name: 'cum',
    alias: ['leche'],
    nsfw: true,
    category: 'interacciones',
    run: async (m, { conn }) => {
        if (!reaction.links.length) return
        const user1 = m.sender
        const user2 = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        const name1 = '@' + user1.split('@')[0]
        const menciones = [user1]
        let textoFinal = ''
        if (user2) {
            menciones.push(user2)
            const name2 = '@' + user2.split('@')[0]
            textoFinal = reaction.txt_mencion.replace(/@user1/g, name1).replace(/@user2/g, name2)
        } else {
            textoFinal = reaction.txt_solo.replace(/@user1/g, name1)
        }
        try {
            if (m.react) await m.react(reaction.emoji)
            const videoUrl = reaction.links[Math.floor(Math.random() * reaction.links.length)]
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: textoFinal,
                gifPlayback: true,
                mentions: menciones
            }, { quoted: m })
        } catch (e) {
            console.error(e)
        }
    }
}

export default cum