import { proto } from '@whiskeysockets/baileys'
import { createInteractiveMessage } from '@ryuu-reinzz/button-helper'   // ← NUEVO

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones', 'menutest', 'interactive'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            const interactive = createInteractiveMessage({
                body: "*PRUEBA DE BOTONES V7*\n\nEste mensaje usa el helper oficial para WhiskeySockets",
                footer: "KIRITO BOT - SISTEMA V6.1.0",
                header: {
                    title: "PANTALLA DE CONTROL",
                    subtitle: "Prueba completa de botones"
                },
                buttons: [
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
                            url: "https://google.com"
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "📋 COPIAR ID",
                            copy_code: m.sender.split('@')[0]
                        })
                    },
                    {
                        name: "single_select",   // ← Lista desplegable
                        buttonParamsJson: JSON.stringify({
                            title: "Elige una opción",
                            sections: [{
                                title: "Opciones",
                                rows: [
                                    { title: "Opción 1", description: "Primera opción", id: "op1" },
                                    { title: "Opción 2", description: "Segunda opción", id: "op2" }
                                ]
                            }]
                        })
                    }
                ]
            })

            const msg = conn.generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363314182963253@newsletter",
                                serverMessageId: 1,
                                newsletterName: "KIRITO BOT"
                            }
                        },
                        interactiveMessage: interactive
                    }
                }
            }, {})

            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

            console.log('✅ Botones enviados con helper @ryuu-reinzz/button-helper')

        } catch (err) {
            console.error('Error:', err)
            await conn.reply(m.chat, `❌ Error: ${err.message}`, m)
        }
    }
}

export default interactiveTestCommand