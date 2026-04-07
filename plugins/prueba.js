import pkg from '@whiskeysockets/baileys'
const { generateWAMessageFromContent } = pkg
// FIX CRÍTICO: Extraer proto de forma segura para que no sea undefined
const proto = pkg.default?.proto || pkg.proto

const testOficialCommand = {
    name: 'testoficial',
    alias: ['pure', 'botones'],
    category: 'admin',
    run: async (m, { conn }) => {
        try {
            // Verificación manual para que no crashee
            if (!proto) {
                return console.log(chalk.red('┃ ERROR: El objeto "proto" no se pudo cargar desde Baileys.'));
            }

            const texto = `✨ Pulsa el botón para unirte al canal oficial`.trim()

            const messageContent = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
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
                                ]
                            })
                        })
                    }
                }
            }

            const msg = generateWAMessageFromContent(m.chat, messageContent, {
                userJid: conn.user.id,
                quoted: m
            })

            await conn.relayMessage(m.chat, msg.message, { 
                messageId: msg.key.id,
                additionalNodes: [{ tag: 'biz', attrs: {} }] 
            })

            console.log(chalk.cyan('┃ ') + chalk.greenBright('Comando ejecutado sin errores de undefined.'));

        } catch (err) {
            console.error('❌ Error en comando:', err.message)
        }
    }
}

export default testOficialCommand
