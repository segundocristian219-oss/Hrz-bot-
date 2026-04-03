import { jidNormalizedUser } from '@whiskeysockets/baileys'

const comandoPerfil = {
    name: 'perfil',
    alias: ['profile', 'p', 'whoami'],
    category: 'rpg',
    run: async (m, { conn, isROwner, isOwner, participants }) => {
        let quien = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
        let nombreUsuario = m.pushName || 'Jugador'

        await m.react("⌛")

        let fotoPerfil
        try {
            fotoPerfil = await conn.profilePictureUrl(quien, 'image')
        } catch (e) {
            fotoPerfil = global.img 
        }

        let datos = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] }).lean()

        if (!datos) {
            datos = { name: nombreUsuario, exp: 0, col: 10, marry: '' }
        }

        let infoPareja = 'Soltero/a'
        let menciones = [quien]

        if (datos.marry && datos.marry !== "") {
            infoPareja = `@${datos.marry.split('@')[0]}`
            menciones.push(datos.marry)
        }

        const esDueño = global.owner.some(dns => dns[0] + '@s.whatsapp.net' === quien) || quien === conn.user.jid
        const esAdminGrupo = participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(quien) && (p.admin === 'admin' || p.admin === 'superadmin'))

        let rango = 'Usuario Registrado'
        if (esDueño) {
            rango = 'Desarrollador / Owner'
        } else if (esAdminGrupo) {
            rango = 'Administrador del Grupo'
        }

        const textoPerfil = `
\t\t\t\t♛  *PERFIL DE USUARIO* ♛

✧  *NOMBRE:* ${datos.name || nombreUsuario}
✧  *ID:* @${quien.split('@')[0]}
✦  *MONEDAS:* ${datos.col ?? 10} Col
✦  *EXPERIENCIA:* ${datos.exp ?? 0} EXP
✦  *ESTADO CIVIL:* ${infoPareja}
◈  *RANGO:* ${rango}

`

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: fotoPerfil }, 
                caption: textoPerfil,
                mentions: menciones
            }, { quoted: m })

            await m.react("✅")
        } catch (error) {
            conn.reply(m.chat, `*Error:* No se pudo generar el perfil.`, m)
            await m.react("❌")
        }
    }
}

export default comandoPerfil