import pkg from '@whiskeysockets/baileys'
import chalk from 'chalk'

const { generateWAMessageFromContent, prepareWAMessageMedia } = (await import('@whiskeysockets/baileys/lib/Utils/messages.js')).default || await import('@whiskeysockets/baileys/lib/Utils/messages.js')

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            const texto = `✨ PRUEBA DE RENDERIZADO`

            const messageContent = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { 
                                text: texto 
                            },
                            footer: { 
                                text: 'Deylin Studio - Systems' 
                            },
                            header: { 
                                title: "CONEXIÓN ESTABLECIDA", 
                                hasMediaAttachment: false 
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'Canal Oficial',
                                            url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m',
                                            merchant_url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m'
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'Ping',
                                            id: '.ping'
                                        })
                                    }
                                ],
                                messageVersion: 1
                            }
                        }
                    }
                }
            }

            const msg = generateWAMessageFromContent(m.chat, messageContent, { 
                userJid: conn.user.id, 
                quoted: m 
            })

            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id 
            })

            console.log(chalk.cyan('┃ ') + chalk.greenBright('Protocolo de botones ejecutado con éxito.'));

        } catch (err) {
            console.error(chalk.red('❌ Error en el sistema de botones:'), err.message)
        }
    }
}

export default testOficialCommand
