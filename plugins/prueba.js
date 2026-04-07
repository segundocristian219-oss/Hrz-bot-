const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            const texto = `✨ PRUEBA DE RENDERIZADO BUSINESS`

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: texto },
                            footer: { text: 'Pikachu Bot - Debug' },
                            header: { 
                                title: "CONEXIÓN EMPRESA", 
                                hasMediaAttachment: false 
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'Canal Oficial',
                                            url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m',
                                            merchant_url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m'
                                        })
                                    }
                                ],
                                messageVersion: 1
                            }
                        }
                    }
                }
            }, { 
                userJid: conn.user.id, 
                quoted: m 
            })

            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id 
            })

            console.log(chalk.cyan('┃ ') + chalk.yellowBright('Mensaje enviado.'));

        } catch (err) {
            console.error(chalk.red('❌ Error:'), err.message)
        }
    }
}
