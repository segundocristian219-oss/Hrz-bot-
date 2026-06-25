import { jidDecode } from '@whiskeysockets/baileys'
import { getRealJid } from '../../../core/identifier.js'

export const marryCommand = {
    category: 'social',
    commands: {
        matrimonio: {
            name: 'matrimonio',
            alias: ['marry', 'casar'],
            run: async (m, { conn, text, command, user, usedPrefix }) => {
                global.weddingGames = global.weddingGames || {}

                const emisorJid = m.sender
                const llaveChat = m.chat

                const dbUser = await global.User.findOne({ id: emisorJid })
                if (!dbUser) {
                    return m.reply('*♛ ERROR ✧*\n\n╰❒ Perfil no cargado. Escribe algo más para registrarte.')
                }

                const estadoCivilEmisor = dbUser.marry
                if (estadoCivilEmisor && estadoCivilEmisor !== "") {
                    return conn.sendMessage(m.chat, {
                        text: `*♛ AVISO ✧*\n\n╰❒ Ya estás casado con @${estadoCivilEmisor.split('@')[0]}.`,
                        contextInfo: { mentionedJid: [estadoCivilEmisor] }
                    }, { quoted: m })
                }

                let inputJid
                if (m.mentionedJid && m.mentionedJid[0]) {
                    inputJid = m.mentionedJid[0]
                } else if (m.quoted) {
                    inputJid = m.quoted.sender
                } else if (text) {
                    const num = text.replace(/[^0-9]/g, '')
                    if (num.length >= 10) inputJid = num + '@s.whatsapp.net'
                }

                if (!inputJid || inputJid === m.sender) {
                    return m.reply(`*♛ ERROR ✧*\n\n╰❒ Menciona a la persona con la que te quieres casar.`)
                }

                const objetivoJid = await getRealJid(conn, inputJid, m)
                const objetivoData = await global.User.findOne({ id: objetivoJid })

                if (!objetivoData) return m.reply('*♛ ERROR ✧*\n\n╰❒ El usuario no está registrado en el bot.')

                const estadoCivilObjetivo = objetivoData.marry
                if (estadoCivilObjetivo && estadoCivilObjetivo !== "") return m.reply('*♛ ERROR ✧*\n\n╰❒ Esa persona ya está casada.')

                const idJuegoBoda = `${llaveChat}-${objetivoJid}`
                if (global.weddingGames[idJuegoBoda]) clearTimeout(global.weddingGames[idJuegoBoda].timeout)

                global.weddingGames[idJuegoBoda] = {
                    tipo: 'boda',
                    solicitante: emisorJid,
                    receptor: objetivoJid,
                    timeout: setTimeout(() => {
                        if (global.weddingGames[idJuegoBoda]) {
                            delete global.weddingGames[idJuegoBoda]
                            conn.sendMessage(m.chat, { text: `*♛ TIEMPO AGOTADO ✧*\n\n╰❒ La propuesta para @${objetivoJid.split('@')[0]} expiró.`, mentions: [objetivoJid] })
                        }
                    }, 60000)
                }

                return conn.sendMessage(m.chat, {
                    text: `*♛ PROPUESTA DE MATRIMONIO ✧*\n\n╰❒ @${emisorJid.split('@')[0]} le pide matrimonio a @${objetivoJid.split('@')[0]}.\n\n> Tienes 60 segundos.\n> Escribe *${usedPrefix}aceptar* o *${usedPrefix}rechazar*`,
                    contextInfo: { mentionedJid: [emisorJid, objetivoJid] }
                }, { quoted: m })
            }
        }
    }
}
