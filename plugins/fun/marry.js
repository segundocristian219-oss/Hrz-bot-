import { getRealJid } from '../../lib/identifier.js'

const matrimonio = {
    name: 'matrimonio',
    alias: ['marry', 'casar', 'divorce', 'divorcio', 'aceptar', 'rechazar'],
    category: 'fun',
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

                if (juego.tipo === 'divorcio') {
                    const parejaA = await global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] })
                    const parejaB = await global.User.findOne({ $or: [{ id: juego.receptor }, { lid: juego.receptor }] })

                    if (parejaA) await global.User.updateOne({ _id: parejaA._id }, { $set: { marry: '', marryDate: 0 } })
                    if (parejaB) await global.User.updateOne({ _id: parejaB._id }, { $set: { marry: '', marryDate: 0 } })

                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*\n\n╰❒ Ambos han aceptado la separación. Ahora son libres.')
                }

                const checkS = await global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] })
                if (!checkS || (checkS.marry && checkS.marry !== "")) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ La propuesta ya no es válida.')
                }

                const idSol = checkS.lid || checkS.id
                const miId = user.lid || user.id

                await global.User.updateOne({ _id: user._id }, { $set: { marry: idSol, marryDate: Date.now() } })
                await global.User.updateOne({ _id: checkS._id }, { $set: { marry: miId, marryDate: Date.now() } })

                delete global.weddingGames[idJuego]

                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ Esposo: @${idSol.split('@')[0]}\n╰❒ Esposa: @${miId.split('@')[0]}\n\n> ¡Ahora están felizmente casados!`,
                    contextInfo: { mentionedJid: [idSol, miId] }
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

            let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

            if (quien !== user.marry) {
                return conn.sendMessage(m.chat, {
                    text: `*♛ SEGURIDAD ✧*\n\n╰❒ Debes mencionar a tu pareja @${user.marry.split('@')[0]} para pedir el divorcio.`,
                    contextInfo: { mentionedJid: [user.marry] }
                }, { quoted: m })
            }

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
                        conn.reply(m.chat, `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ @${idPareja.split('@')[0]} no respondió a la solicitud.`, null, { mentions: [idPareja] })
                    }
                }, 15000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} ha pedido el divorcio a @${idPareja.split('@')[0]}.\n\n> Tienes 15 segundos.\n> Escribe *${usedPrefix}aceptar* o *${usedPrefix}rechazar*`,
                contextInfo: { mentionedJid: [emisorReal, idPareja] }
            }, { quoted: m })
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

        if (!quien || quien.length < 10 || quien === m.sender) return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona a tu futura pareja.`)

        let objetivo = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] })
        if (!objetivo) {
            const limpio = quien.split('@')[0].split(':')[0]
            objetivo = await global.User.findOne({ $or: [{ id: new RegExp(limpio) }, { lid: new RegExp(limpio) }] })
        }

        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ @${quien.split('@')[0]} no está registrado.`, null, { mentions: [quien] })

        if (user.marry && user.marry !== "") {
            return conn.sendMessage(m.chat, {
                text: `*♛ AVISO ✧*\n\n╰❒ Ya estás casado con @${user.marry.split('@')[0]}.`,
                contextInfo: { mentionedJid: [user.marry] }
            }, { quoted: m })
        }

        if (objetivo.marry && objetivo.marry !== "") {
            const parejaObj = objetivo.marry
            return conn.sendMessage(m.chat, {
                text: `*♛ AVISO ✧*\n\n╰❒ @${(objetivo.id || objetivo.lid).split('@')[0]} ya está casado/a.`,
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
                    conn.reply(m.chat, `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta para @${idObjetivo.split('@')[0]} expiró.`, null, { mentions: [idObjetivo] })
                }
            }, 15000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} le pide matrimonio a @${idObjetivo.split('@')[0]}.\n\n> Tienes 15 segundos.\n\n*Opciones:* \n> Escribe *${usedPrefix}aceptar*\n> Escribe *${usedPrefix}rechazar*`,
            contextInfo: { mentionedJid: [emisorReal, idObjetivo] }
        }, { quoted: m })
    }
}

export default matrimonio