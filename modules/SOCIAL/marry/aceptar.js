import { jidDecode } from '@whiskeysockets/baileys'
import { getRealJid } from '../../../core/identifier.js'

export const acceptCommand = {
    category: 'social',
    commands: {
        aceptar: {
            name: 'aceptar',
            alias: [],
            run: async (m, { conn, text, command, user, usedPrefix }) => {
                global.weddingGames = global.weddingGames || {}

                const emisorJid = m.sender
                const llaveChat = m.chat

                const dbUser = await global.User.findOne({ id: emisorJid })
                if (!dbUser) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado. Escribe algo más para registrarte.')
                }

                const idJuego = Object.keys(global.weddingGames).find(key => 
                    key.startsWith(llaveChat) && global.weddingGames[key].receptor === emisorJid
                )
                const juego = idJuego ? global.weddingGames[idJuego] : null

                if (!juego) return m.reply('*♛ AVISO ✧*\n\n╰❒ No tienes peticiones pendientes.')

                clearTimeout(juego.timeout)

                const parejaA = await global.User.findOne({ id: juego.solicitante })
                const parejaB = await global.User.findOne({ id: juego.receptor })

                if (!parejaA || !parejaB) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Usuario no encontrado en la base de datos.')
                }

                if (juego.tipo === 'divorcio') {
                    await global.User.findOneAndUpdate({ id: juego.solicitante }, { $set: { marry: '', marryDate: 0 } })
                    await global.User.findOneAndUpdate({ id: juego.receptor }, { $set: { marry: '', marryDate: 0 } })

                    if (user) {
                        user.marry = ''
                    }
                    const cachesGlobales = [global.db?.data?.users, global.db?.users, global.users]
                    for (const cache of cachesGlobales) {
                        if (cache) {
                            if (cache[juego.solicitante]) {
                                cache[juego.solicitante].marry = ''
                            }
                            if (cache[juego.receptor]) {
                                cache[juego.receptor].marry = ''
                            }
                        }
                    }

                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ DIVORCIO FINALIZADO ✧*\n\n╰❒ Ambos han aceptado la separación. Ahora son libres.')
                }

                const casadoA = parejaA.marry
                const casadoB = parejaB.marry

                if ((casadoA && casadoA !== "") || (casadoB && casadoB !== "")) {
                    delete global.weddingGames[idJuego]
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Uno de los dos ya se casó con otra persona.')
                }

                await global.User.findOneAndUpdate({ id: juego.solicitante }, { $set: { marry: juego.receptor, marryDate: Date.now() } })
                await global.User.findOneAndUpdate({ id: juego.receptor }, { $set: { marry: juego.solicitante, marryDate: Date.now() } })

                if (user) {
                    const parejaIdentificada = juego.solicitante === emisorJid ? juego.receptor : juego.solicitante
                    user.marry = parejaIdentificada
                }
                const cachesGlobales = [global.db?.data?.users, global.db?.users, global.users]
                for (const cache of cachesGlobales) {
                    if (cache) {
                        if (cache[juego.solicitante]) {
                            cache[juego.solicitante].marry = juego.receptor
                        }
                        if (cache[juego.receptor]) {
                            cache[juego.receptor].marry = juego.solicitante
                        }
                    }
                }

                delete global.weddingGames[idJuego]

                return conn.sendMessage(m.chat, {
                    text: `*♛ ¡BODA FINALIZADA! ✧*\n\n╰❒ @${juego.solicitante.split('@')[0]} y @${juego.receptor.split('@')[0]} ahora están casados.`,
                    contextInfo: { mentionedJid: [juego.solicitante, juego.receptor] }
                }, { quoted: m })
            }
        }
    }
}
