import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg

const canalCommand = {
    name: 'canal',
    alias: ['canaloficial'],
    category: 'info',
    run: async (m, { conn }) => {
        try {
            const texto = `✨ Pulsa el botón para unirte al canal oficial`.trim()

            const interactiveMessage = {
                body: { text: texto },
                footer: { text: 'Pikachu Bot by Deylin' },
                header: { 
                    title: "KIRITO - NEWS",
                    hasMediaAttachment: false 
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '✐ Canal oficial',
                                url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m',
                                merchant_url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m'
                            })
                        },
                        {
                            name: 'quick_reply', // Cambiado para que sea compatible con Native Flow
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Creador',
                                id: '.creador'
                            })
                        }
                    ],
                    messageVersion: 1
                }
            }

            // Enviamos directamente el objeto interactiveMessage
            // Tu index.js se encarga de ponerle el viewOnce y los metadatos de dispositivo
            await conn.relayMessage(m.chat, { interactiveMessage }, { 
                messageId: generateMessageID(),
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ]
            })

            console.log('✅ Canal oficial enviado')

        } catch (err) {
            console.error('❌ Error en comando canal:', err.message)
        }
    }
}

export default canalCommand
