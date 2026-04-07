import pkg from '@whiskeysockets/baileys'
const { proto, generateMessageID } = pkg

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones', 'menutest'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            const buttons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "✅ ACEPTAR",
                        id: "action_accept"
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🌐 SITIO WEB",
                        url: "https://google.com",
                        merchant_url: "https://google.com"
                    })
                },
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 COPIAR ID",
                        copy_code: m.sender.split('@')[0]
                    })
                }
            ]

            const interactiveMessage = proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                    text: "*PRUEBA DE PROTOCOLO V7*\n\nEste mensaje usa la estructura nativa requerida por la versión más reciente de Baileys."
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: "KIRITO BOT - SISTEMA V6.1.0"
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                    title: "PANTALLA DE CONTROL",
                    subtitle: "Subtítulo de prueba",
                    hasMediaAttachment: false
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: buttons,
                    messageVersion: 1
                })
            })

            const messageProto = proto.Message.create({
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
            })

            await conn.relayMessage(m.chat, messageProto, {
                messageId: generateMessageID()
            })

        } catch (err) {
            console.error('Error en Interactive V7:', err)
        }
    }
}

export default interactiveTestCommand
