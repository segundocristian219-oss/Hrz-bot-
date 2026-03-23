import { jidNormalizedUser } from '@whiskeysockets/baileys'

const profileCommand = {
    name: 'perfil',
    alias: ['profile', 'p', 'whoami'],
    category: 'rpg',
    run: async (m, { conn }) => {
        let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
        let userName = m.pushName || 'Jugador'
        
        await m.react("⌛")

        let pp
        try {
            pp = await conn.profilePictureUrl(who, 'image')
        } catch (e) {
            pp = global.img 
        }

        let user = await global.User.findOne({ id: who }).lean()
        
        if (!user) {
            user = { name: userName, exp: 0, col: 10 }
        }

        const infoText = `
\t\t\t\t♛  *KIRITO USER PROFILE* ♛

✧  *NOMBRE:* ${user.name || userName}
✧  *ID:* @${who.split('@')[0]}
✦  *MONEDAS:* ${user.col ?? 10} Col
✦  *EXPERIENCIA:* ${user.exp ?? 0} EXP
◈  *ESTADO:* ${who === m.sender ? 'Administrador del Sistema' : 'Usuario Registrado'}

`

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: pp }, 
                caption: infoText,
                mentions: [who],
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.ch, 
                        newsletterName: name()
                    }
                }
            }, { quoted: m })

            await m.react("✅")
        } catch (error) {
            conn.reply(m.chat, `*Error:* No se pudo generar el perfil.`, m)
            await m.react("❌")
        }
    }
}

export default profileCommand
