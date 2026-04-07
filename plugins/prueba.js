import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg
import { createInteractiveMessage } from '@ryuu-reinzz/button-helper'

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones', 'interactive'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            const interactive = createInteractiveMessage({
                body: "*SISTEMA V7 ACTIVO*\n\nSi recibes esto, el patch de conexión funcionó.",
                footer: "KIRITO BOT",
                header: {
                    title: "PANTALLA DE CONTROL",
                    hasMediaAttachment: false
                },
                buttons: [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "✅ ACEPTAR", id: "action_accept" })
                    },
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({ display_text: "🌐 WEB", url: "https://google.com" })
                    }
                ]
            })

            // IMPORTANTE: No metas 'interactive' dentro de otro viewOnceMessage manualmente aqui
            // Dejamos que relayMessage lo maneje con los nodos adicionales
            await conn.relayMessage(m.chat, { interactiveMessage: interactive }, { 
                messageId: generateMessageID(),
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: {}
                    }
                ]
            })

            console.log('✅ Intento de envío completado')

        } catch (err) {
            console.error('Error:', err)
        }
    }
}

export default interactiveTestCommand
