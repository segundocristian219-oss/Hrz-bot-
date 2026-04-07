import pkg from '@whiskeysockets/baileys'
const { proto } = pkg

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            const messageId = `KIRITO${Date.now()}`

            const interactiveMessage = {
                body: { 
                    text: "🧪 *SISTEMA V7 VALIDADO*\n\nSi este mensaje aparece con botones, tu index.js está procesando los metadatos correctamente." 
                },
                footer: { 
                    text: "KIRITO BOT - ESTABLE" 
                },
                header: { 
                    title: "DEBUG FINAL", 
                    hasMediaAttachment: false 
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ 
                                display_text: "✅ FUNCIONA", 
                                id: "test_ok" 
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

            const msg = proto.Message.fromObject({
                interactiveMessage: interactiveMessage
            })

            await conn.relayMessage(m.chat, msg, { 
                messageId: messageId,
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ]
            })

            console.log('✅ Nodo enviado con ID:', messageId)

        } catch (err) {
            console.error('❌ Error en relay:', err.message)
        }
    }
}

export default testOficialCommand
