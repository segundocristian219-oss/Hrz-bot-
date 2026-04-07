import pkg from '@whiskeysockets/baileys'
import chalk from 'chalk'

const { generateWAMessageFromContent } = (await import('@whiskeysockets/baileys/lib/Utils/messages.js')).default || await import('@whiskeysockets/baileys/lib/Utils/messages.js')

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            const texto = `✨ PRUEBA DE RENDERIZADO BUSINESS`.trim()

            const interactiveMessage = {
                body: { text: texto },
                footer: { text: 'Pikachu Bot - Debug' },
                header: { title: "CONEXIÓN EMPRESA", hasMediaAttachment: false },
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

            // Generamos el mensaje envolviéndolo manualmente en viewOnce y messageContextInfo
            // Esto a veces "salta" el filtro de las cuentas Business
            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { 
                userJid: conn.user.id, 
                quoted: m 
            })

            // El relayMessage con el tag 'biz' es CRÍTICO para cuentas de empresa
            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id,
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ] 
            })

            console.log(chalk.cyan('┃ ') + chalk.yellowBright('Paquete entregado. Si no aparece, revisa si el número receptor te tiene agregado.'));

        } catch (err) {
            console.error(chalk.red('❌ Error en relay:'), err.message)
        }
    }
}

export default testOficialCommand
