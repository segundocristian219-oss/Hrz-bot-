import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

const bots = {
    name: 'listasubbots',
    alias: ['subbots', 'bots', 'listasub'],
    category: 'main',
    run: async (m, { conn }) => {
        if (!global.conns || global.conns.length === 0) {
            return m.reply('❌ No hay sub-bots activos en este momento.');
        }

        const activeBots = global.conns.filter(sock => sock.user && sock.user.id);

        if (activeBots.length === 0) {
            return m.reply('❌ No hay sub-bots conectados actualmente.');
        }

        let txt = `✨ *SUB-BOTS ACTIVOS* ✨\n\n`;
        txt += `Total: ${activeBots.length}\n\n`;

        // Limpiamos los JIDs para que las menciones funcionen sí o sí
        const mentions = activeBots.map(sock => {
            const jid = sock.user.id.split(':')[0];
            return `${jid}@s.whatsapp.net`;
        });

        activeBots.forEach((sock, i) => {
            const jid = sock.user.id.split(':')[0];
            const name = sock.user.name || 'Sub-Bot';
            txt += `*${i + 1}.* @${jid} (${name})\n`;
        });

        // Construimos el mensaje con el botón "Ver canal" como en tu captura
        const messageContent = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: txt }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Voker Systems • Deylin' }),
                        header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Ver canal 📢",
                                        url: "https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m",
                                        merchant_url: "https://whatsapp.com/channel/0029VawF8fBBvvsktcInIz3m"
                                    })
                                }
                            ]
                        }),
                        contextInfo: {
                            mentionedJid: mentions,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363305113111051@newsletter',
                                newsletterName: 'Voker Updates',
                                serverMessageId: -1
                            }
                        }
                    })
                }
            }
        };

        const msg = generateWAMessageFromContent(m.chat, messageContent, {
            userJid: conn.user.id,
            quoted: m
        });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
};

export default bots;
