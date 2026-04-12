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

            if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes.')

            if (cmd === 'aceptar') {
                clearTimeout(juego.timeout)
                
                const solicitante = await global.User.findOne({ 
                    $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] 
                })
                const receptor = await global.User.findOne({ 
                    $or: [{ id: juego.receptor }, { lid: juego.receptor }] 
                })

                if (!solicitante || !receptor) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Uno de los usuarios no existe.')
                }

                if (juego.tipo === 'divorcio') {
                    await global.User.updateOne({ _id: solicitante._id }, { $set: { marry: '', marryDate: 0 } })
                    await global.User.updateOne({ _id: receptor._id }, { $set: { marry: '', marryDate: 0 } })
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*')
                }

                if ((solicitante.marry && solicitante.marry !== "") || (receptor.marry && receptor.marry !== "")) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ AVISO ✧*\n\n╰❒ Uno de los dos ya se encuentra casado.')
                }

                const idS = solicitante.lid || solicitante.id
                const idR = receptor.lid || receptor.id
                const now = Date.now()

                await global.User.updateOne({ _id: solicitante._id }, { $set: { marry: idR, marryDate: now } })
                await global.User.updateOne({ _id: receptor._id }, { $set: { marry: idS, marryDate: now } })
                
                delete global.weddingGames[idJuego]

                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ @${idS.split('@')[0]} y @${idR.split('@')[0]} ahora están casados.`,
                    contextInfo: { mentionedJid: [idS, idR] }
                }, { quoted: m })
            }

            if (cmd === 'rechazar') {
                clearTimeout(juego.timeout)
                delete global.weddingGames[idJuego]
                return m.reply('*♛ PETICIÓN RECHAZADA ✧*')
            }
        }

        if (cmd === 'divorce' || cmd === 'divorcio') {
            if (!user.marry) return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')
            
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
                    }
                }, 60000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} pide divorcio a @${idPareja.split('@')[0]}.\n\n> Escribe ${usedPrefix}aceptar`,
                contextInfo: { mentionedJid: [emisorReal, idPareja] }
            }, { quoted: m })
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') !== '' ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null

        if (!quien || quien === m.sender || quien === conn.user.jid) return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona a alguien válido.`)

        let objetivo = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] })
        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ El usuario no está en la base de datos.`)

        if (user.marry) return m.reply(`*♛ AVISO ✧*\n\n╰❒ Ya estás casado con @${user.marry.split('@')[0]}`, { mentions: [user.marry] })
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
                }
            }, 60000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} le pide matrimonio a @${idObjetivo.split('@')[0]}.\n\n> Tienes 60 segundos para ${usedPrefix}aceptar`,
            contextInfo: { mentionedJid: [emisorReal, idObjetivo] }
        }, { quoted: m })
    }
}

export default matrimonio
