import { getRealJid } from '../../lib/identifier.js'

const matrimonio = {
    name: 'matrimonio',
    alias: ['marry', 'casar', 'divorce', 'divorcio', 'aceptar', 'rechazar'],
    category: 'fun',
    run: async (m, { conn, text, command, user, usedPrefix }) => {
        global.weddingGames = global.weddingGames || {}

        if (!user) return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado.')

        const emisorReal = user.lid || user.id || m.sender
        const llaveChat = m.chat
        const cmd = command.trim().toLowerCase()

        if (cmd === 'aceptar' || cmd === 'rechazar') {
            const idJuego = `${llaveChat}-${emisorReal}`
            const juego = global.weddingGames[idJuego]

            if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes o el tiempo expiró.')

            if (cmd === 'aceptar') {
                clearTimeout(juego.timeout)
                if (juego.tipo === 'divorcio') {
                    await global.User.updateOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] }, { $set: { marry: '', marryDate: 0 } })
                    await global.User.updateOne({ $or: [{ id: juego.receptor }, { lid: juego.receptor }] }, { $set: { marry: '', marryDate: 0 } })
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*')
                }

                const checkS = await global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] })
                if (!checkS || (checkS.marry && checkS.marry !== "")) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ La propuesta ya no es válida.')
                }

                const idSol = checkS.lid || checkS.id
                const miId = emisorReal

                await global.User.updateOne({ _id: user._id }, { $set: { marry: idSol, marryDate: Date.now() } })
                await global.User.updateOne({ _id: checkS._id }, { $set: { marry: miId, marryDate: Date.now() } })
                delete global.weddingGames[idJuego]

                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ @${idSol.split('@')[0]} y @${miId.split('@')[0]} ahora están casados.`,
                    contextInfo: { mentionedJid: [idSol, miId] }
                }, { quoted: m })
            }

            if (cmd === 'rechazar') {
                clearTimeout(juego.timeout)
                delete global.weddingGames[idJuego]
                return m.reply('*♛ PETICIÓN RECHAZADA ✧*')
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
                        conn.reply(m.chat, `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ @${idPareja.split('@')[0]} no respondió al divorcio.`, null, { mentionedJid: [idPareja] })
                    }
                }, 20000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} pide divorcio a @${idPareja.split('@')[0]}.\n\n> Tienes 20 segundos.\n> Escribe ${usedPrefix}aceptar`,
                contextInfo: { mentionedJid: [emisorReal, idPareja] }
            }, { quoted: m })
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') !== '' ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null

        if (!quien || quien === m.sender || quien === conn.user.jid) return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona o responde a alguien para casarte.`)

        let objetivo = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] })
        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ El usuario no está registrado en la base de datos tiene que usar el comando *(#menu)* para iniciar el registro automático.`)

        if (user.marry) return m.reply(`*♛ AVISO ✧*\n\n╰❒ Ya estás casado.`)
        if (objetivo.marry) return m.reply(`*♛ AVISO ✧*\n\n╰❒ Esa persona ya está casada.`)

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
                    conn.sendMessage(m.chat, { text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta para @${idObjetivo.split('@')[0]} expiró.`, contextInfo: { mentionedJid: [idObjetivo] } }, { quoted: m })
                }
            }, 20000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} le pide matrimonio a @${idObjetivo.split('@')[0]}.\n\n> Tienes 20 segundos.\n\n*Opciones:* \n> ${usedPrefix}aceptar\n> ${usedPrefix}rechazar`,
            contextInfo: { mentionedJid: [emisorReal, idObjetivo] }
        }, { quoted: m })
    }
}

export default matrimonio
