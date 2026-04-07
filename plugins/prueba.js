import * as crypto from 'crypto'
import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg

const snippetPagoCommand = {
    name: 'snippetpago',
    alias: ['snippet'],
    category: 'ai',
    run: async (m, { conn }) => {
        try {
            const message = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: { hasMediaAttachment: false },
                            body: { text: "📦 *SNIPPET GENERADO*" },
                            footer: { text: "KIRITO BOT" },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "Ver Repositorio",
                                            url: "https://github.com/",
                                            merchant_url: "https://github.com/"
                                        })
                                    }
                                ],
                                messageVersion: 1
                            },
                            contextInfo: {
                                mentionedJid: [m.sender],
                                isForwarded: true,
                                forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
                                businessMessageForwardInfo: { businessOwnerJid: "867051314767696@bot" }
                            }
                        }
                    }
                }
            }

            // Inyectamos el bloque de código directamente en el nodo de mensaje
            message.viewOnceMessage.message.botForwardedMessage = {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{
                            messageType: 5,
                            codeMetadata: {
                                codeLanguage: "javascript",
                                codeBlocks: [{
                                    highlightType: 1,
                                    codeContent: "// plugin: pago-nativo.js\nimport * as crypto from 'crypto'\nimport pkg from '@whiskeysockets/baileys'\nconst { generateMessageID } = pkg\n\nconst handler = async (m, { conn }) => {\n  // Código de pago nativo activo\n}\n\nexport default handler"
                                }]
                            }
                        }]
                    }
                }
            }

            await conn.relayMessage(m.chat, message, {
                messageId: generateMessageID(),
                participant: m.sender
            })

        } catch (err) {
            console.error('Error al enviar snippet:', err)
        }
    }
}

export default snippetPagoCommand
