const adopcion = {
    name: 'adoptar',
    alias: ['hijo', 'desheredar', 'abandonar', 'aceptarhijo', 'rechazarhijo'],
    category: 'social',
    run: async (m, { conn, text, command, user, usedPrefix }) => {
        global.adoptionGames = global.adoptionGames || {}

        if (!user) return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado.')

        const emisorId = user.lid || user.id || m.sender
        const chatKey = m.chat
        const cmd = command.trim().toLowerCase()

        if (cmd === 'aceptarhijo' || cmd === 'rechazarhijo') {
            const idJuego = `${chatKey}-${emisorId}`
            const juego = global.adoptionGames[idJuego]

            if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones de adopción pendientes.')

            if (cmd === 'aceptarhijo') {
                clearTimeout(juego.timeout)
                
                await global.User.updateOne({ _id: user._id }, { 
                    $addToSet: { padres: { $each: [juego.padre1, juego.padre2] } } 
                })

                await global.User.updateOne({ $or: [{ id: juego.padre1 }, { lid: juego.padre1 }] }, { 
                    $addToSet: { hijos: emisorId } 
                })
                await global.User.updateOne({ $or: [{ id: juego.padre2 }, { lid: juego.padre2 }] }, { 
                    $addToSet: { hijos: emisorId } 
                })

                delete global.adoptionGames[idJuego]
                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡ADOPCIÓN COMPLETADA! ✧*\n\n╰❒ @${emisorId.split('@')[0]} ahora es hijo de @${juego.padre1.split('@')[0]} y @${juego.padre2.split('@')[0]}.\n\n> ¡La familia ha crecido!`,
                    contextInfo: { mentionedJid: [emisorId, juego.padre1, juego.padre2] }
                }, { quoted: m })
            }

            if (cmd === 'rechazarhijo') {
                clearTimeout(juego.timeout)
                delete global.adoptionGames[idJuego]
                return m.reply('*♛ ADOPCIÓN RECHAZADA ✧*\n\n╰❒ El usuario no quiso ser adoptado.')
            }
        }

        if (!user.marry || user.marry === "") {
            return m.reply('*♛ AVISO ✧*\n\n╰❒ Solo las parejas casadas pueden adoptar hijos.')
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null
        
        if (!quien) {
            const num = text.replace(/[^0-9]/g, '')
            if (num.length >= 10) quien = num + '@s.whatsapp.net'
        }

        if (!quien || quien === m.sender || quien === user.marry) return m.reply('*♛ ERROR ✧*\n\n╰❒ Menciona al usuario que quieres adoptar.')

        const limpio = quien.split('@')[0]
        let objetivo = await global.User.findOne({ $or: [{ id: new RegExp('^' + limpio) }, { lid: new RegExp('^' + limpio) }] })

        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ @${limpio} no está registrado.`, null, { mentions: [quien] })

        if (objetivo.padres && objetivo.padres.length >= 2) return m.reply('*♛ AVISO ✧*\n\n╰❒ Este usuario ya tiene padres.')

        const idObjetivo = objetivo.lid || objetivo.id
        const idJuegoAdop = `${chatKey}-${idObjetivo}`

        if (global.adoptionGames[idJuegoAdop]) clearTimeout(global.adoptionGames[idJuegoAdop].timeout)

        global.adoptionGames[idJuegoAdop] = {
            padre1: emisorId,
            padre2: user.marry,
            hijo: idObjetivo,
            timeout: setTimeout(() => {
                if (global.adoptionGames[idJuegoAdop]) {
                    delete global.adoptionGames[idJuegoAdop]
                    conn.sendMessage(m.chat, { text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta de adopción para @${idObjetivo.split('@')[0]} expiró.`, mentions: [idObjetivo] })
                }
            }, 20000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE ADOPCIÓN ✧*\n\n╰❒ @${emisorId.split('@')[0]} y su pareja @${user.marry.split('@')[0]} quieren adoptarte como hijo/a @${idObjetivo.split('@')[0]}.\n\n> Tienes 20 segundos para responder.\n\n*Opciones:* \n> Escribe *${usedPrefix}aceptarhijo*\n> Escribe *${usedPrefix}rechazarhijo*`,
            contextInfo: { mentionedJid: [emisorId, user.marry, idObjetivo] }
        }, { quoted: m })
    }
}

export default adopcion
