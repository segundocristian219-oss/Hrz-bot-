import axios from 'axios'

const reaction = {
    emoji: '🫂',
    txt_solo: '> ❒ @user1 se está abrazando así mismo/a...',
    txt_mencion: '> ❏ @user1 le está dando un fuerte abrazo a @user2 🫂',
    links: [
'https://media.tenor.com/J7eGDvGeP9IAAAPo/enage-kiss-anime-hug.mp4',
'https://media.tenor.com/7f9CqFtd4SsAAAPo/hug.mp4',
'https://media.tenor.com/sJATVEhZ_VMAAAPo/max-and-kaylee-profile-picture.mp4',
'https://media.tenor.com/ApfJHef4J1UAAAPo/love-anime.mp4',
'https://media.tenor.com/c6nworIweBYAAAPo/cuddle-love.mp4',
'https://media.tenor.com/RXbJCXFnwIwAAAPo/hugs-anime.mp4',
'https://media.tenor.com/SYsRdiK-T7gAAAPo/hug-anime.mp4',
'https://media.tenor.com/9y-c-mXuJUoAAAPo/hug-anime.mp4',
'https://media.tenor.com/hYja0d71ss4AAAPo/these-guys.mp4',
'https://media.tenor.com/EX0f-orgGwoAAAPo/love.mp4',
'https://media.tenor.com/FCBl9L-SO9QAAAPo/anime-lycoris-recoil.mp4',
'https://media.tenor.com/I77M4aWAGk8AAAPo/hug.mp4'
]
}

const hug = {
    name: 'hug',
    alias: ['hug', 'abrazo'],
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

export default hug
