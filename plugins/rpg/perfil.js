import { jidNormalizedUser } from '@whiskeysockets/baileys'

const profileCommand = {
    name: 'perfil',
    alias: ['profile', 'p', 'whoami'],
    category: 'user',
    run: async (m, { conn, user }) => {
        let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
        let userName = m.pushName || 'Jugador'
        
        await m.react("⌛")

        let pp
        try {
            pp = await conn.profilePictureUrl(who, 'image')
        } catch (e) {
            pp = global.img 
        }

        const userData = (who === m.sender) ? user : (global.db.data.users[who] || { name: userName, exp: 0, col: 10 })
        
        const infoText = `
\t\t\t\t♛  *USER PROFILE* ♛

✧  *NOMBRE:* ${userData.name || userName}
✧  *ID:* @${who.split('@')[0]}
✦  *MONEDAS:* ${userData.col || 0} Col
✦  *EXPERIENCIA:* ${userData.exp || 0} EXP
◈  *ESTADO:* ${who === m.sender ? 'Administrador del Sistema' : 'Usuario Registrado'}

\t\t\t\t  *DEYLIN ELÍAC - SYSTEM*
`.trim()

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: pp }, 
                caption: infoText,
                mentions: [who],
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.ch || "120363000000000000@newsletter", 
                        serverMessageId: 100,
                        newsletterName: "Deylin Elíac - Updates"
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

export default profileCommand;
