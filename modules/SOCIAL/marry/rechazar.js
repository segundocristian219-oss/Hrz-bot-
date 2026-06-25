import { jidDecode } from '@whiskeysockets/baileys'
import { getRealJid } from '../../../core/identifier.js'

export const rejectCommand = {
    category: 'social',
    commands: {
        rechazar: {
            name: 'rechazar',
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
                delete global.weddingGames[idJuego]
                return m.reply(juego.tipo === 'divorcio' ? '*♛ DIVORCIO CANCELADO ✧*' : '*♛ PROPUESTA RECHAZADA ✧*')
            }
        }
    }
}
