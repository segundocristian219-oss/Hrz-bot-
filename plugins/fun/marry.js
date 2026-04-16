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

        const getList = (u) => {
            if (!u.marry) return []
            if (Array.isArray(u.marry)) return u.marry
            return u.marry ? [u.marry] : []
        }

        const buscarJuego = () => {
            const keys = Object.keys(global.weddingGames)
            for (let k of keys) {
                const j = global.weddingGames[k]
                if (j && (j.receptor === emisorReal || j.solicitante === emisorReal) && k.startsWith(llaveChat)) return { key: k, data: j }
            }
            return null
        }

        if (cmd === 'aceptar' || cmd === 'rechazar') {
            const found = buscarJuego()
            if (!found) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes o el tiempo expiró.')

            const { key: idJuego, data: juego } = found

            if (cmd === 'aceptar') {
                clearTimeout(juego.timeout)

                if (juego.tipo === 'divorcio') {
                    await global.User.updateOne(
                        { $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] },
                        { $pull: { marry: juego.receptor } }
                    )
                    await global.User.updateOne(
                        { $or: [{ id: juego.receptor }, { lid: juego.receptor }] },
                        { $pull: { marry: juego.solicitante } }
                    )

                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*')
                }

                const checkS = await global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] })
                if (!checkS) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ La propuesta ya no es válida.')
                }

                const idSol = checkS.lid || checkS.id
                const miId = emisorReal

                await global.User.updateOne(
                    { _id: user._id },
                    { $addToSet: { marry: idSol }, $set: { marryDate: Date.now() } }
                )

                await global.User.updateOne(
                    { _id: checkS._id },
                    { $addToSet: { marry: miId }, $set: { marryDate: Date.now() } }
                )

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
            const lista = getList(user)
            if (!lista.length) return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')

            let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null
            if (!quien || !lista.includes(quien)) return m.reply('*♛ ERROR ✧*\n\n╰❒ Menciona a tu pareja para divorciarte.')

            const idJuegoDiv = `${llaveChat}-${Date.now()}`

            global.weddingGames[idJuegoDiv] = {
                tipo: 'divorcio',
                solicitante: emisorReal,
                receptor: quien,
                timeout: setTimeout(() => {
                    if (global.weddingGames[idJuegoDiv]) {
                        delete global.weddingGames[idJuegoDiv]
                        conn.reply(m.chat, `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ @${quien.split('@')[0]} no respondió al divorcio.`, null, { mentionedJid: [quien] })
                    }
                }, 20000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} pide divorcio a @${quien.split('@')[0]}.\n\n> Tienes 20 segundos.\n> Escribe ${usedPrefix}aceptar`,
                contextInfo: { mentionedJid: [emisorReal, quien] }
            }, { quoted: m })
        }

        let quien = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') !== '' ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null

        if (!quien || quien === m.sender || quien === conn.user.jid) return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona o responde a alguien para casarte.`)

        let objetivo = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] })
        if (!objetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ El usuario no está registrado.`)

        const listaUser = getList(user)
        const listaObj = getList(objetivo)

        if (listaUser.includes(quien)) return m.reply(`*♛ AVISO ✧*\n\n╰❒ Ya estás casado con esa persona.`)

        const idObjetivo = objetivo.lid || objetivo.id
        const idJuegoBoda = `${llaveChat}-${Date.now()}`

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
