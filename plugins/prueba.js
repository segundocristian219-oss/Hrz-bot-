import pkg from '@whiskeysockets/baileys'
import chalk from 'chalk'

const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default || await import('@whiskeysockets/baileys')

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            const texto = `✨ SISTEMA DE RENDERIZADO ACTIVO`

            const messageContent = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: texto
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: 'Deylin Studio - Engine v6'
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: "VERIFICACIÓN DE PROTOCOLO",
                                subtitle: "Status: Online",
                                hasMediaAttachment: false
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "Canal Oficial",
                                            url: "https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m",
                                            merchant_url: "https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m"
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "Ejecutar Comando",
                                            id: ".menu"
                                        })
                                    }
                                ],
                                messageVersion: 1
                            })
                        })
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

            console.log(chalk.cyan('┃ ') + chalk.greenBright('Mensaje inyectado correctamente en el flujo de relay.'));

        } catch (err) {
            console.error(chalk.red('❌ Error en el núcleo de botones:'), err.message)
        }
    }
}

export default testOficialCommand
