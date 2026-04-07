import pkg from '@whiskeysockets/baileys'
import chalk from 'chalk'

const { proto } = (await import('@whiskeysockets/baileys/WAProto/index.js')).default || await import('@whiskeysockets/baileys/WAProto/index.js')
const { generateWAMessageFromContent } = (await import('@whiskeysockets/baileys/lib/Utils/messages.js')).default || await import('@whiskeysockets/baileys/lib/Utils/messages.js')

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            if (!proto) return console.log(chalk.red('┃ ERROR: proto no cargado'))

            const texto = `✨ Pulsa el botón para unirte al canal oficial`.trim()

            // Definimos solo el interactiveMessage puro
            const interactiveMessage = proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({ text: texto }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Pikachu Bot by Deylin' }),
                header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: '✐ canal oficial',
                                url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m',
                                merchant_url: 'https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m'
                            })
                        }
                    ],
                    messageVersion: 1
                })
            })

            // Generamos el mensaje base sin envolverlo aún en viewOnce
            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, {
                userJid: conn.user.id,
                quoted: m
            })

            // El relayMessage enviará el nodo 'biz' que es obligatorio para cuentas Business
            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id,
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: { native_flow_name: 'order_details' }
                    }
                ] 
            })

            console.log(chalk.cyan('┃ ') + chalk.greenBright('Nodo enviado al servidor de WhatsApp...'))

        } catch (err) {
            console.error(chalk.red('❌ Error en comando:'), err.message)
        }
    }
}

export default testOficialCommand
