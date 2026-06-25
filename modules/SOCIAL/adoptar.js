import { getRealJid } from '../../core/identifier.js'

export const hije = {
    category: 'social',
    commands: {
        adoptar: {
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

                        await global.User.updateOne({ id: emisorId }, { 
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

                let inputJid = null

                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    inputJid = m.mentionedJid[0]
                } else if (m.quoted && m.quoted.sender) {
                    inputJid = m.quoted.sender
                } else if (text) {
                    const num = text.replace(/[^0-9]/g, '')
                    if (num.length >= 10) {
                        inputJid = num + '@s.whatsapp.net'
                    }
                }

                if (!inputJid || inputJid === m.sender || inputJid === user.marry) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Menciona al usuario que quieres adoptar o responde a su mensaje.')
                }

                const objetivoJid = await getRealJid(conn, inputJid, m)
                let objetivo = await global.User.findOne({ $or: [{ id: objetivoJid }, { lid: objetivoJid }] })

                
                if (!objetivo) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ El usuario que deseas adoptar no se encuentra registrado en nuestro sistema público de la adopción.')
                }

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
                    }, 60000) 
                }

                return conn.sendMessage(m.chat, {
                    text: `*♛ PROPUESTA DE ADOPCIÓN ✧*\n\n╰❒ @${emisorId.split('@')[0]} y su pareja @${user.marry.split('@')[0]} quieren adoptarte como hijo/a @${idObjetivo.split('@')[0]}.\n\n> Tienes 60 segundos para responder.\n\n*Opciones:* \n> Escribe *${usedPrefix}aceptarhijo*\n> Escribe *${usedPrefix}rechazarhijo*`,
                    contextInfo: { mentionedJid: [emisorId, user.marry, idObjetivo] }
                }, { quoted: m })
            }
        }
    }
}
