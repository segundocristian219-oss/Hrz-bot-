import { getRealJid } from '../../lib/identifier.js'

const matrimonio = {
    name: 'matrimonio',
    alias: ['marry', 'casar', 'divorce', 'divorcio', 'aceptar', 'rechazar'],
    category: 'fun',
    run: async (m, { conn, text, command, user, usedPrefix }) => {
        global.weddingGames = global.weddingGames || {}

        if (!user) return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado.')

        const fix = (id) => getRealJid(id || '')
        const emisorReal = fix(user.lid || user.id || m.sender)
        const llaveChat = m.chat
        const cmd = (command || m.command || '').toLowerCase()

        const getList = (u) => {
            if (!u.marry) return []
            if (Array.isArray(u.marry)) return u.marry.map(fix)
            return [fix(u.marry)]
        }

        const buscarJuego = () => {
            for (let k in global.weddingGames) {
                if (!k.startsWith(llaveChat)) continue
                const j = global.weddingGames[k]
                if (!j) continue

                if (
                    fix(j.receptor) === emisorReal ||
                    fix(j.solicitante) === emisorReal ||
                    fix(j.receptor) === fix(m.sender) ||
                    fix(j.solicitante) === fix(m.sender)
                ) {
                    return { key: k, data: j }
                }
            }
            return null
        }

        if (cmd === 'aceptar' || cmd === 'rechazar') {
            const found = buscarJuego()
            if (!found) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes o expiraron.')

            const { key, data } = found
            clearTimeout(data.timeout)

            if (cmd === 'rechazar') {
                delete global.weddingGames[key]
                return m.reply('*♛ PETICIÓN RECHAZADA ✧*')
            }

            if (data.tipo === 'divorcio') {
                await global.User.updateOne(
                    { $or: [{ id: data.solicitante }, { lid: data.solicitante }] },
                    { $pull: { marry: data.receptor } }
                )
                await global.User.updateOne(
                    { $or: [{ id: data.receptor }, { lid: data.receptor }] },
                    { $pull: { marry: data.solicitante } }
                )

                delete global.weddingGames[key]
                return m.reply('*♛ DIVORCIO FINALIZADO ✧*')
            }

            const checkS = await global.User.findOne({
                $or: [{ id: data.solicitante }, { lid: data.solicitante }]
            })

            if (!checkS) {
                delete global.weddingGames[key]
                return m.reply('*♛ ERROR ✧*\n\n╰❒ La propuesta ya no es válida.')
            }

            const idSol = fix(checkS.lid || checkS.id)
            const miId = emisorReal

            await global.User.updateOne(
                { _id: user._id },
                { $addToSet: { marry: idSol }, $set: { marryDate: Date.now() } }
            )

            await global.User.updateOne(
                { _id: checkS._id },
                { $addToSet: { marry: miId }, $set: { marryDate: Date.now() } }
            )

            delete global.weddingGames[key]

            return conn.sendMessage(m.chat, {
                text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ @${idSol.split('@')[0]} y @${miId.split('@')[0]} ahora están casados.`,
                mentions: [idSol, miId]
            }, { quoted: m })
        }

        if (cmd === 'divorce' || cmd === 'divorcio') {
            const lista = getList(user)
            if (!lista.length) return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')

            let quien = null

            if (m.mentionedJid?.[0]) {
                quien = fix(m.mentionedJid[0])
            } else if (m.quoted) {
                quien = fix(m.quoted.sender)
            } else if (text) {
                const num = text.replace(/[^0-9]/g, '')
                if (num) quien = fix(num + '@s.whatsapp.net')
            }

            if (!quien && lista.length === 1) quien = lista[0]

            if (!quien || !lista.includes(quien)) {
                return m.reply('*♛ ERROR ✧*\n\n╰❒ Menciona, responde o usa el número de tu pareja.')
            }

            const idJuego = `${llaveChat}-${Date.now()}`

            global.weddingGames[idJuego] = {
                tipo: 'divorcio',
                solicitante: emisorReal,
                receptor: quien,
                timeout: setTimeout(() => {
                    delete global.weddingGames[idJuego]
                    conn.sendMessage(m.chat, {
                        text: `*♛ TIEMPO AGOTADO ✧*`,
                        mentions: [quien]
                    }, { quoted: m })
                }, 20000)
            }

            return conn.sendMessage(m.chat, {
                text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} → @${quien.split('@')[0]}\n\n> ${usedPrefix}aceptar`,
                mentions: [emisorReal, quien]
            }, { quoted: m })
        }

        let quien = m.mentionedJid?.[0]
            ? fix(m.mentionedJid[0])
            : m.quoted
            ? fix(m.quoted.sender)
            : text && text.replace(/[^0-9]/g, '')
            ? fix(text.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            : null

        if (!quien || quien === fix(m.sender) || quien === fix(conn.user.id)) {
            return m.reply('*♛ ERROR ✧*\n\n╰❒ Menciona o responde a alguien.')
        }

        let objetivo = await global.User.findOne({
            $or: [{ id: quien }, { lid: quien }]
        })

        if (!objetivo) return m.reply('*♛ ERROR ✧*\n\n╰❒ Usuario no registrado.')

        const listaUser = getList(user)
        if (listaUser.includes(quien)) {
            return m.reply('*♛ AVISO ✧*\n\n╰❒ Ya estás casado.')
        }

        const idObjetivo = fix(objetivo.lid || objetivo.id)
        const idJuego = `${llaveChat}-${Date.now()}`

        global.weddingGames[idJuego] = {
            tipo: 'boda',
            solicitante: emisorReal,
            receptor: idObjetivo,
            timeout: setTimeout(() => {
                delete global.weddingGames[idJuego]
                conn.sendMessage(m.chat, {
                    text: '*♛ TIEMPO AGOTADO ✧*',
                    mentions: [idObjetivo]
                }, { quoted: m })
            }, 20000)
        }

        return conn.sendMessage(m.chat, {
            text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorReal.split('@')[0]} → @${idObjetivo.split('@')[0]}\n\n> ${usedPrefix}aceptar\n> ${usedPrefix}rechazar`,
            mentions: [emisorReal, idObjetivo]
        }, { quoted: m })
    }
}

export default matrimonio
