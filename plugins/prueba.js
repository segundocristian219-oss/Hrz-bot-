import pkg from '@whiskeysockets/baileys'
const { generateMessageID } = pkg

const snippetPagoCommand = {
    name: 'snippetpago',
    alias: ['snippet'],
    category: 'ai',
    run: async (m, { conn }) => {
        try {
            const codeText = "```" + 
                "// plugin: pago-nativo.js\n" +
                "import * as crypto from 'crypto'\n" +
                "import pkg from '@whiskeysockets/baileys'\n" +
                "const { generateMessageID } = pkg\n\n" +
                "// Lógica de pago nativo" + 
                "```";

            await conn.sendMessage(m.chat, { 
                text: codeText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }
                }
            }, { quoted: m });

        } catch (err) {
            console.error(err);
        }
    }
}

export default snippetPagoCommand
