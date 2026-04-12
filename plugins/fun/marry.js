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

        const resolveCanonicalId = (doc) => doc.lid || doc.id

        if (cmd === 'aceptar' || cmd === 'rechazar') {
            const idJuego = `${llaveChat}-${emisorReal}`
            const juego = global.weddingGames[idJuego]

            if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes o el tiempo expiró.')

            clearTimeout(juego.timeout)

            if (cmd === 'rechazar') {
                delete global.weddingGames[idJuego]
                return m.reply('*♛ PETICIÓN RECHAZADA ✧*')
            }

            if (cmd === 'aceptar') {
                if (juego.tipo === 'divorcio') {
                    const [docA, docB] = await Promise.all([
                        global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] }),
                        global.User.findOne({ $or: [{ id: juego.receptor }, { lid: juego.receptor }] })
                    ])

                    if (!docA || !docB) {
                        delete global.weddingGames[idJuego]
                        return m.reply('*♛ ERROR ✧*\n\n╰❒ No se encontraron los perfiles.')
                    }

                    await Promise.all([
                        global.User.updateOne({ _id: docA._id }, { $set: { marry: '', marryDate: 0 } }),
                        global.User.updateOne({ _id: docB._id }, { $set: { marry: '', marryDate: 0 } })
                    ])

                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*\n\n╰❒ Ambos perfiles han sido actualizados.')
                }

                if (juego.tipo === 'boda') {
                    const [docSol, docRec] = await Promise.all([
                        global.User.findOne({ $or: [{ id: juego.solicitante }, { lid: juego.solicitante }] }),
                        global.User.findOne({ $or: [{ id: juego.receptor }, { lid: juego.receptor }] })
                    ])

                    if (!docSol || !docRec) {
                        delete global.weddingGames[idJuego]
                        return m.reply('*♛ ERROR ✧*\n\n╰❒ Uno o ambos perfiles no encontrados.')
                    }

                    if (docSol.marry && docSol.marry !== '') {
                        delete global.weddingGames[idJuego]
                        return m.reply('*♛ ERROR ✧*\n\n╰❒ El solicitante ya está casado. Propuesta inválida.')
                    }

                    if (docRec.marry && docRec.marry !== '') {
                        delete global.weddingGames[idJuego]
                        return m.reply('*♛ ERROR ✧*\n\n╰❒ Ya estás casado. No puedes aceptar.')
                    }

                    const idSol = resolveCanonicalId(docSol)
                    const idRec = resolveCanonicalId(docRec)
                    const now = Date.now()

                    await Promise.all([
                        global.User.updateOne({ _id: docSol._id }, { $set: { marry: idRec, marryDate: now } }),
                        global.User.updateOne({ _id: docRec._id }, { $set: { marry: idSol, marryDate: now } })
                    ])

                    delete global.weddingGames[idJuego]

                    return conn.sendMessage(m.chat, {
                        text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ @${idSol.split('@')[0]} y @${idRec.split('@')[0]} ahora están casados. 💍`,
                        contextInfo: { mentionedJid: [idSol, idRec] }
                    }, { quoted: m })
                }
            }
        }

        if (cmd === 'divorce' || cmd === 'divorcio') {
            if (!user.marry || user.marry === '') return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')

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
                        conn.sendMessage(m.chat, {
                            text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ @${idPareja.split('@')[0]} no respondió al divorcio.`,
                            contextInfo: { mentionedJid: [idPareja] }
                        }, { quoted: m })
                    }
                }, 20000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} pide divorcio a @${idPareja.split('@')[0]}.\n\n> Tienes 20 segundos.\n> Escribe ${usedPrefix}aceptar`,
                contextInfo: { mentionedJid: [emisorReal, idPareja] }
            }, { quoted: m })
        }

        if (cmd === 'matrimonio' || cmd === 'marry' || cmd === 'casar') {
            let quien = m.mentionedJid && m.mentionedJid[0]
                ? m.mentionedJid[0]
                : m.quoted
                    ? m.quoted.sender
                    : text.replace(/[^0-9]/g, '') !== ''
                        ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                        : null

            if (!quien || quien === m.sender || quien === conn.user.jid) {
                return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona o responde a alguien para casarte.`)
            }

            const [docObjetivo] = await Promise.all([
                global.User.findOne({ $or: [{ id: quien }, { lid: quien }] })
            ])

            if (!docObjetivo) return m.reply(`*♛ ERROR ✧*\n\n╰❒ El usuario no está registrado. Debe usar *(${usedPrefix}menu)* para iniciar su registro.`)

            if (user.marry && user.marry !== '') return m.reply(`*♛ AVISO ✧*\n\n╰❒ Ya estás casado.`)
            if (docObjetivo.marry && docObjetivo.marry !== '') return m.reply(`*♛ AVISO ✧*\n\n╰❒ Esa persona ya está casada.`)

            const idObjetivo = resolveCanonicalId(docObjetivo)

            if (idObjetivo === emisorReal) return m.reply(`*♛ ERROR ✧*\n\n╰❒ No puedes casarte contigo mismo.`)

            const idJuegoBoda = `${llaveChat}-${idObjetivo}`

            if (global.weddingGames[idJuegoBoda]) clearTimeout(global.weddingGames[idJuegoBoda].timeout)

            global.weddingGames[idJuegoBoda] = {
                tipo: 'boda',
                solicitante: emisorReal,
                receptor: idObjetivo,
                timeout: setTimeout(() => {
                    if (global.weddingGames[idJuegoBoda]) {
                        delete global.weddingGames[idJuegoBoda]
                        conn.sendMessage(m.chat, {
                            text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta para @${idObjetivo.split('@')[0]} expiró.`,
                            contextInfo: { mentionedJid: [idObjetivo] }
                        }, { quoted: m })
                    }
                }, 20000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} le pide matrimonio a @${idObjetivo.split('@')[0]}.\n\n> Tienes 20 segundos.\n\n*Opciones:*\n> ${usedPrefix}aceptar\n> ${usedPrefix}rechazar`,
                contextInfo: { mentionedJid: [emisorReal, idObjetivo] }
            }, { quoted: m })
        }
    }
}

export default matrimonio
