import { proto } from '@whiskeysockets/baileys'

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones', 'menutest', 'interactive'],
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
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "❌ CANCELAR",
                        id: "action_cancel"
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
                    text: "*PRUEBA DE BOTONES V7*\n\nEste mensaje usa la estructura nativa oficial de Baileys v7+"
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: "KIRITO BOT - SISTEMA V6.1.0"
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                    title: "PANTALLA DE CONTROL",
                    subtitle: "Prueba de botones interactivos",
                    hasMediaAttachment: false
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: buttons,
                    messageVersion: 1
                })
            })

            // Estructura completa + truco newsletter (mejor renderizado en Android + iOS)
            const msg = conn.generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                            // Truco oficial recomendado para que se vea en iOS y Android
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363314182963253@newsletter",  // puedes cambiarlo
                                serverMessageId: 1,
                                newsletterName: "KIRITO BOT"
                            }
                        },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, {})

            await conn.relayMessage(m.chat, msg.message, {
                messageId: msg.key.id
            })

            console.log('✅ Mensaje interactivo V7 enviado correctamente')

        } catch (err) {
            console.error('Error en Interactive V7:', err)
            await conn.reply(m.chat, `❌ Error al enviar botones: ${err.message}`, m)
        }
    }
}

export default interactiveTestCommand