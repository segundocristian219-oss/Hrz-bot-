import pkg from '@ryuu-reinzz/button-helper';
const { createInteractiveMessage } = pkg;
import pkgBaileys from '@whiskeysockets/baileys';
const { generateMessageID } = pkgBaileys;

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones', 'interactive'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            const interactive = createInteractiveMessage({
                body: "*CONEXIÓN EXITOSA*\n\nEl error de importación ha sido corregido.",
                footer: "KIRITO BOT",
                header: {
                    title: "SISTEMA V7",
                    hasMediaAttachment: false
                },
                buttons: [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "✅ FUNCIONA", id: "ok" })
                    }
                ]
            });

            await conn.relayMessage(m.chat, { interactiveMessage: interactive }, { 
                messageId: generateMessageID(),
                additionalNodes: [{ tag: 'biz', attrs: {} }]
            });

            console.log('✅ Mensaje enviado tras corregir SyntaxError');

        } catch (err) {
            console.error('Error en el comando:', err);
        }
    }
};

export default interactiveTestCommand;
