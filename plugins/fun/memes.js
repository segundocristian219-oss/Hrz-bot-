import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

const testTexto = {
    name: 'testtexto',
    alias: ['tt'],
    category: 'debug',
    run: async (m, { conn }) => {
        try {
            await m.react('🕒');

            // --- MENSAJE 1: ESTRUCTURA NATIVE FLOW (QUICK REPLY) ---
            const msg1 = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: `*MENSAJE 1: BOTÓN DE RESPUESTA*\n\nEste es el formato más común para menús.` 
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Voker Systems' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Click Aquí ⚡',
                                        id: '.memes'
                                    })
                                }]
                            })
                        })
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg1.message, { messageId: msg1.key.id });

            // --- MENSAJE 2: ESTRUCTURA URL (CTA URL) ---
            const msg2 = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: `*MENSAJE 2: BOTÓN DE ENLACE*\n\nEste botón te lleva a una web externa.` 
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Voker Systems' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [{
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Ir a la Web 🌐',
                                        url: 'https://dix.lat',
                                        merchant_url: 'https://dix.lat'
                                    })
                                }]
                            })
                        })
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg2.message, { messageId: msg2.key.id });

            // --- MENSAJE 3: LISTA (SINGLE SELECT) ---
            const msg3 = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: `*MENSAJE 3: MENÚ DE LISTA*\n\nIdeal cuando tienes muchas opciones.` 
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Voker Systems' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [{
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: 'Ver Opciones 📂',
                                        sections: [{
                                            title: "CATEGORÍAS",
                                            rows: [
                                                { title: "Meme", rowId: ".meme", description: "Ver un meme" },
                                                { title: "Menú", rowId: ".menu", description: "Ir al inicio" }
                                            ]
                                        }]
                                    })
                                }]
                            })
                        })
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg3.message, { messageId: msg3.key.id });

            await m.react('✅');

        } catch (error) {
            console.error('Error en Test Texto:', error);
            await m.react('❌');
        }
    }
};

export default testTexto;
