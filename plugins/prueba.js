import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            // Generamos ID manual para evitar fallos de importación
            const messageId = `KIRITO${Date.now()}`

            // Estructura de mensaje interactivo pura
            const interactiveMessage = {
                body: { text: "🧪 *DEBUG V7 FINAL*\n\nSi ves esto, superamos todos los errores de importación." },
                footer: { text: "KIRITO BOT - ESTABLE" },
                header: { title: "ESTADO DEL SISTEMA", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "ACEPTAR", id: "ok" })
                        }
                    ],
                    messageVersion: 1
                }
            }

            // Enviamos el objeto plano. 
            // El 'patchMessageBeforeSending' del index.js se encargará de envolverlo.
            await conn.relayMessage(m.chat, { interactiveMessage }, { 
                messageId: messageId,
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ]
            })

            console.log('✅ Nodo enviado al servidor con ID:', messageId)

        } catch (err) {
            console.error('❌ Error en relay:', err.message)
        }
    }
}

export default testOficialCommand
