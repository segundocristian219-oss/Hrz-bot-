import axios from 'axios'

const reaction = {
    emoji: '🏳️‍🌈',
    txt_solo: '> ❒ @user1 se dió un beso a si misma por qué está orgullosa de ser lesbiana...',
    txt_mencion: '> ❏ @user1 le dió un beso a @user2 viva el amor LGBT 🏳️‍🌈',
    links: [
'https://media.tenor.com/IeSi0qaEni4AAAPo/watanare-mai.mp4',
'https://media.tenor.com/yuJWwHaMBh0AAAPo/anime-girls-kissing-anime.mp4',
'https://media.tenor.com/Wy7VLl0Zn6MAAAPo/love-and-deepspace-kiss.mp4',
'https://media.tenor.com/FDQSeLwjEW0AAAPo/kanamemo-girls-love.mp4',
'https://media.tenor.com/NONQCK-3XZYAAAPo/anime-kiss.mp4',
'https://media.tenor.com/OoQ6ABYZ8b0AAAPo/lesbian.mp4',
'https://media.tenor.com/8cagn3dRZ5gAAAPo/lesbian.mp4',
'https://media.tenor.com/vYvKFU1SNV8AAAPo/lesbian-anime.mp4',
'https://media.tenor.com/PSh5JTcJxUkAAAPo/utena-tenjou.mp4',
'https://media.tenor.com/Zr86O9xJF3QAAAPo/anime-kiss-anime.mp4',
'https://media.tenor.com/jOJlPnkaNk8AAAPo/anime-girl-anime.mp4'
]
}

const kiss3 = {
    name: 'kiss3',
    alias: ['beso3', 'kiss3'],
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

export default kiss3
