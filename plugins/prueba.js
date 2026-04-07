import * as crypto from 'crypto'
import pkg from '@whiskeysockets/baileys'
const { generateMessageID, prepareWAMessageMedia } = pkg

const snippetPagoCommand = {
    name: 'snippetpago',
    alias: ['snippet'],
    category: 'ai',
    run: async (m, { conn }) => {
        try {
            const message = {
                viewOnceMessageV2: {
                    message: {
                        interactiveMessage: {
                            header: { 
                                title: "SISTEMA DE PAGO",
                                hasMediaAttachment: false 
                            },
                            body: { text: "📦 *BLOQUE DE CÓDIGO DETECTADO*" },
                            footer: { text: "KIRITO BOT - DEVELOPER" },
                            nativeFlowMessage: {
                                buttons: [{
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Soporte",
                                        url: "https://google.com"
                                    })
                                }],
                                messageVersion: 1
                            }
                        }
                    }
                }
            }

            // Inyección del contenedor de código (Snippet)
            message.viewOnceMessageV2.message.botForwardedMessage = {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [{
                            messageType: 5,
                            codeMetadata: {
                                codeLanguage: "javascript",
                                codeBlocks: [{
                                    highlightType: 1,
                                    codeContent: "// plugin: pago-nativo.js\nimport pkg from '@whiskeysockets/baileys'\nconst { generateMessageID } = pkg\n\nconst handler = async (m, { conn }) => {\n  console.log('Ejecutando snippet de pago');\n}\n\nexport default handler"
                                }]
                            }
                        }]
                    }
                }
            }

            await conn.relayMessage(m.chat, message, {
                messageId: generateMessageID(),
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ]
            })

        } catch (err) {
            console.error('Error crítico en relayMessage:', err)
        }
    }
}

export default snippetPagoCommand
