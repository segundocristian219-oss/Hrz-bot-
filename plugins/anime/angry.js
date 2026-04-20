import axios from 'axios'

const reaction = {
    emoji: '😡',
    txt_solo: '> ❒ @user1 está enojado con todo el grupo... 😡',
    txt_mencion: '> ❏ @user1 está enojado con @user2 😡',
    links: [
'https://media.tenor.com/tx3x8ANgbBwAAAPo/the-dreaming-boy-is-a-realist-yumemiru-danshi.mp4',
'https://media.tenor.com/pbqNBWOx6xUAAAPo/annoyed-anime-girl-annoyed.mp4',
'https://media.tenor.com/cYRAeQqpaUMAAAPo/anime-angry-slow-loop.mp4',
'https://media.tenor.com/hkoyf1VeaZ4AAAPo/anime-angry.mp4',
'https://media.tenor.com/3oYh5_W_Fd8AAAPo/brat-annoying.mp4',
'https://media.tenor.com/DGfqf7xX7YQAAAPo/leonardo-watch-leo.mp4',
'httpss//media.tenor.com/Rxjl-XIiekMAAAPo/angry.mp4',
'https://media.tenor.com/qiOZauqDU8gAAAPo/mad-angry.mp4',
'https://media.tenor.com/9JjBiqaxzdAAAAPo/anime-angry.mp4',
'https://media.tenor.com/tx3x8ANgbBwAAAPo/the-dreaming-boy-is-a-realist-yumemiru-danshi.mp4',
'https://media.tenor.com/U8vM8y9oJjUAAAPo/nisekoi-chitoge-kirisaki.mp4',
'https://media.tenor.com/5hCo-bxm3mUAAAPo/gojo-gojo-annoyed.mp4',
'https://media.tenor.com/z2iFD-hLYnAAAAPo/anime-girl-anime.mp4'
]
}

const angry = {
    name: 'angry',
    alias: ['enojado', 'angry'],
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
                mentions: menciones,
                contextInfo: {
                    ...channelInfo
               }
            }, { quoted: m })
        } catch (e) {
            console.error(e)
        }
    }
}

export default angry
