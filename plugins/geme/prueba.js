

const h = {
name: 'h',
alias: ['k'],
category: 'y',
    run: async (m, { conn, text  }) => {
let k = 'ggjj'

  await conn.sendMessage(m.chat, { 
    text: k,
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: ch,
            serverMessageId: 100,
            newsletterName: name()
        }
    }
}, { quoted: m });

   }
};

export default h;