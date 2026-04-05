import axios from 'axios'

const reaction = {
    emoji: '💦',
    txt_solo: '> ❒ @user1 quiere hacer el delicioso.',
    txt_mencion: '> ❏ @user1 le está haciendo el delicioso a @user2 como nunca se lo avían echo. 🥵\n que salvaje...',
    links: [
'https://api.dix.lat/media2/1775363849590.mp4',
'https://api.dix.lat/media2/1775363843272.mp4',
'https://api.dix.lat/media2/1775363841839.mp4'
]
}

const fuck = {
    name: 'fuck',
    alias: ['fuck'],
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

export default fuck