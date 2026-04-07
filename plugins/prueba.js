import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

export default {
    name: 'vercodigo',
    category: 'dev',
    run: async (socket, m, { jid }) => {
        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: "Protocolo de Visualización de Código v2" },
                        footer: { text: "Deylin Studio" },
                        header: { 
                            title: "Código en Javascript",
                            hasSubtitle: false 
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Ver Repositorio",
                                        url: "https://github.com"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: jid, quoted: m })

        await socket.relayMessage(jid, msg.message, { messageId: msg.key.id })
    }
}
