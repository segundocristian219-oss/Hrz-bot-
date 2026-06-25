import { jidDecode } from '@whiskeysockets/baileys'
import { getRealJid } from '../../../core/identifier.js'

export const divorceCommand = {
    category: 'social',
    commands: {
        divorcio: {
            name: 'divorcio',
            alias: ['divorce'],
            run: async (m, { conn, text, command, user, usedPrefix }) => {
                global.weddingGames = global.weddingGames || {}

                const emisorJid = m.sender
                const llaveChat = m.chat

                const dbUser = await global.User.findOne({ id: emisorJid })
                if (!dbUser) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado. Escribe algo más para registrarte.')
                }

                const miPareja = dbUser.marry
                if (!miPareja || miPareja === "" || miPareja === null) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ No estás casado.')
                }

                const idJuegoDiv = `${llaveChat}-${miPareja}`
                if (global.weddingGames[idJuegoDiv]) clearTimeout(global.weddingGames[idJuegoDiv].timeout)

                global.weddingGames[idJuegoDiv] = {
                    tipo: 'divorcio',
                    solicitante: emisorJid,
                    receptor: miPareja,
                    timeout: setTimeout(() => {
                        if (global.weddingGames[idJuegoDiv]) {
                            delete global.weddingGames[idJuegoDiv]
                            conn.sendMessage(m.chat, { 
                                text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La solicitud de divorcio expiró.`, 
                                contextInfo: { mentionedJid: [miPareja] } 
                            })
                        }
                    }, 60000)
                }

                return conn.sendMessage(m.chat, {
                    text: `*♛ SOLICITUD DE DIVORCIO ✧*\n\n╰❒ @${emisorJid.split('@')[0]} quiere divorciarse de @${miPareja.split('@')[0]}.\n\n> Escribe *${usedPrefix}aceptar* para confirmar o *${usedPrefix}rechazar*.`,
                    contextInfo: { mentionedJid: [emisorJid, miPareja] }
                }, { quoted: m })
            }
        }
    }
}
