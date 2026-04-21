import { getRealJid } from '../../lib/identifier.js'

const matrimonio = {
    name: 'matrimonio',
    alias: ['marry', 'casar', 'divorce', 'divorcio', 'aceptar', 'rechazar'],
    category: 'social',
    run: async (m, { conn, text, command, user, usedPrefix }) => {
        global.weddingGames = global.weddingGames || {}

        if (!user) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado. Escribe algo más para registrarte.')
        }

        const emisorReal = user.lid || user.id || m.sender
        const llaveChat = m.chat
        const cmd = command.trim().toLowerCase()

        if (cmd === 'marry' || cmd === 'casar') {
            if (user.marry && user.marry !== "") {
                return conn.sendMessage(m.chat, {
                    text: `*♛ AVISO ✧*\n\n╰❒ Ya estás casado con @${user.marry.split('@')[0]}.`,
                    contextInfo: { mentionedJid: [user.marry] }
                }, { quoted: m })
            }
        }

        if (cmd === 'aceptar' || cmd === 'rechazar') {
            const idsPosibles = [m.sender, emisorReal]
            let idJuego = null
            let juego = null

            for (let id of idsPosibles) {
                if (global.weddingGames[`${llaveChat}-${id}`]) {
                    idJuego = `${llaveChat}-${id}`
                    juego = global.weddingGames[idJuego]
                    break
                }
            }

            if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes o el tiempo expiró.')

            if (cmd === 'aceptar') {
                clearTimeout(juego.timeout)

                const parejaA = await global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] })
                const parejaB = await global.User.findOne({ $or: [{ id: juego.receptor }, { lid: juego.receptor }] })

                if (!parejaA || !parejaB) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Uno de los usuarios no existe en la base de datos.')
                }

                if (juego.tipo === 'divorcio') {
                    await global.User.updateOne({ _id: parejaA._id }, { $set: { marry: '', marryDate: 0 } })
                    await global.User.updateOne({ _id: parejaB._id }, { $set: { marry: '', marryDate: 0 } })

                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*\n\n╰❒ Ambos han aceptado la separación. Ahora son libres.')
                }

                if ((parejaA.marry && parejaA.marry !== "") || (parejaB.marry && parejaB.marry !== "")) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ La propuesta ya no es válida, uno de los dos ya se casó.')
                }

                const idA = parejaA.lid || parejaA.id
                const idB = parejaB.lid || parejaB.id

                await global.User.updateOne({ _id: parejaA._id }, { $set: { marry: idB, marryDate: Date.now() } })
                await global.User.updateOne({ _id: parejaB._id }, { $set: { marry: idA, marryDate: Date.now() } })

                delete global.weddingGames[idJuego]

                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ Pareja 1: @${idA.split('@')[0]}\n╰❒ Pareja 2: @${idB.split('@')[0]}\n\n> ¡Ahora están felizmente casados!`,
                    contextInfo: { mentionedJid: [idA, idB] }
                }, { quoted: m })
            }

            if (cmd === 'rechazar') {
                clearTimeout(juego.timeout)
                delete global.weddingGames[idJuego]
                return m.reply(juego.tipo === 'divorcio' ? '*♛ DIVORCIO CANCELADO ✧*' : '*♛ PROPUESTA RECHAZADA ✧*')
            }
        }

        if (cmd === 'divorce' || cmd === 'divorcio') {
            if (!user.marry || user.marry === "") return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')

            const idPareja = user.marry
            const idJuegoDiv = `${llaveChat}-${idPareja}`

            if (global.weddingGames[idJuegoDiv]) clearTimeout(global.weddingGames[idJuegoDiv].timeout)

            global.weddingGames[idJuegoDiv] = {
                tipo: 'divorcio',
                solicitante: emisorReal,
                receptor: idPareja,
                timeout: setTimeout(() => {
                    if (global.weddingGames[idJuegoDiv]) {
                        delete global.weddingGames[idJuegoDiv]
                        conn.sendMessage(m.chat, { text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ @${idPareja.split('@')[0]} no respondió a la solicitud.`, mentions: [idPareja] })
                    }
                }, 30000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} ha pedido el divorcio a @${idPareja.split('@')[0]}.\n\n> Tienes 15 segundos.\n> Escribe *${usedPrefix}aceptar* o *${usedPrefix}rechazar*`,
                contextInfo: { mentionedJid: [emisorReal, idPareja] }
            }, { quoted: m })
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null

        if (!quien || quien.split('@')[0].length < 10 || quien === m.sender) return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona a tu futura pareja.`)

        const limpio = quien.split('@')[0].split(':')[0]
        let objetivo = await global.User.findOne({ $or: [{ id: new RegExp('^' + limpio) }, { lid: new RegExp('^' + limpio) }] })

        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ @${limpio} no está registrado.`, null, { mentions: [quien] })

        if (user.marry && user.marry !== "") {
            return conn.sendMessage(m.chat, {
                text: `*♛ AVISO ✧*\n\n╰❒ Ya estás casado con @${user.marry.split('@')[0]}.`,
                contextInfo: { mentionedJid: [user.marry] }
            }, { quoted: m })
        }

        if (objetivo.marry && objetivo.marry !== "") {
            return conn.sendMessage(m.chat, {
                text: `*♛ AVISO ✧*\n\n╰❒ @${(objetivo.id || objetivo.lid).split('@')[0]} ya está casado.`,
                contextInfo: { mentionedJid: [objetivo.id || objetivo.lid] }
            }, { quoted: m })
        }

        const idObjetivo = objetivo.lid || objetivo.id
        const idJuegoBoda = `${llaveChat}-${idObjetivo}`

        if (global.weddingGames[idJuegoBoda]) clearTimeout(global.weddingGames[idJuegoBoda].timeout)

        global.weddingGames[idJuegoBoda] = {
            tipo: 'boda',
            solicitante: emisorReal, 
            receptor: idObjetivo,
            timeout: setTimeout(() => { 
                if (global.weddingGames[idJuegoBoda]) {
                    delete global.weddingGames[idJuegoBoda]
                    conn.sendMessage(m.chat, { text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta para @${idObjetivo.split('@')[0]} expiró.`, mentions: [idObjetivo] })
                }
           }, 30000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} le pide matrimonio a @${idObjetivo.split('@')[0]}.\n\n> Tienes 15 segundos.\n\n*Opciones:* \n> Escribe *${usedPrefix}aceptar*\n> Escribe *${usedPrefix}rechazar*`,
            contextInfo: { mentionedJid: [emisorReal, idObjetivo] }
        }, { quoted: m })
    }
}

export default matrimonio
