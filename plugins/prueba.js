import pkg from '@whiskeysockets/baileys'
const { proto, generateMessageID } = pkg

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            // Construcción manual del InteractiveMessage usando el proto oficial
            const interactiveMessage = {
                body: { text: "🧪 *PRUEBA OFICIAL BAILEYS V7*\n\nSi este mensaje llega, el parche en index.js está activo." },
                footer: { text: "KIRITO BOT - DEBUG MODE" },
                header: { 
                    title: "DEBUG SISTEMA", 
                    hasMediaAttachment: false 
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "TERMINAR DEBUG",
                                id: "debug_done"
                            })
                        },
                        {
                            name: "cta_copy",
                            buttonParamsJson: JSON.stringify({
                                display_text: "COPIAR MI ID",
                                copy_code: m.sender
                            })
                        }
                    ],
                    messageVersion: 1
                }
            }

            // Enviamos vía relayMessage envolviendo en viewOnceMessage
            await conn.relayMessage(m.chat, { 
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { 
                messageId: generateMessageID(),
                additionalNodes: [{ tag: 'biz', attrs: {} }] 
            })

            console.log('✅ Intento de envío oficial realizado.')

        } catch (err) {
            console.error('❌ Error en Baileys Oficial:', err)
        }
    }
}

export default testOficialCommand
