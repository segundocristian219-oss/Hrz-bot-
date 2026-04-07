import pkg from '@whiskeysockets/baileys'
const { proto } = pkg

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            // Generamos el ID directamente desde la conexión o con un string aleatorio
            const messageId = conn.generateMessageID ? conn.generateMessageID() : `KIRITO${Date.now()}`

            const interactiveMessage = {
                body: { text: "🧪 *DEBUG BAILEYS V7*\n\nSi ves esto, el error de generateMessageID ha sido superado." },
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

            const msg = proto.Message.fromObject({
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveMessage
                    }
                }
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

            console.log('✅ Nodo enviado correctamente con ID:', messageId)

        } catch (err) {
            console.error('❌ Error en relay:', err)
        }
    }
}

export default testOficialCommand
