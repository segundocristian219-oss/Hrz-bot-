import { jidNormalizedUser } from '@whiskeysockets/baileys'

const comandoPerfil = {
    name: 'perfil',
    alias: ['profile', 'p', 'whoami'],
    category: 'social',
    run: async (m, { conn, isROwner, participants }) => {
        let quien = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
        let nombreUsuario = m.pushName || 'Jugador'

        let fotoPerfil
        try {
            fotoPerfil = await conn.profilePictureUrl(quien, 'image')
        } catch (e) {
            fotoPerfil = 'https://api.dix.lat/media2/1776379459477.png' 
        }

        let datos = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] }).lean()

        if (!datos) {
            datos = { name: nombreUsuario, exp: 0, col: 10, marry: '', age: 0, gender: '', identity: '' }
        }

        let infoPareja = 'ESTADO CIVIL: Soltero/a'
        let menciones = [quien]

        if (datos.marry && datos.marry !== "") {
            infoPareja = `CASADO/A CON: @${datos.marry.split('@')[0]}`
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
\t\t\t\t--- PERFIL DE USUARIO ---

|  NOMBRE: ${datos.name || nombreUsuario}
|  EDAD: ${datos.age || '--'} años
|  ID: @${quien.split('@')[0]}
|
|  GENERO: ${datos.gender || 'No definido'}
|  ORIENTACION: ${datos.identity || 'No definido'}
|
|  MONEDAS: ${datos.col ?? 0} Col
|  EXPERIENCIA: ${datos.exp ?? 0} EXP
|  ${infoPareja}
|  RANGO: ${rango}

`

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: fotoPerfil }, 
                caption: textoPerfil,
                mentions: menciones
            }, { quoted: m })
        } catch (error) {
            conn.reply(m.chat, `> Error: No se pudo generar la carta de perfil.`, m)
        }
    }
}

export default comandoPerfil;
