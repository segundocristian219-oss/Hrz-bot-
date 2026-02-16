const ownerCommand = {
    name: 'owner',
    alias: ['creador', 'contacto', 'admin'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '50433191934'
        const myJid = myNumber + '@s.whatsapp.net'
        const name = await conn.getName(myJid) || 'Deylin'

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${name}\n` +
                      `N:;${name};;;\n` +
                      'ORG:Deylin - System Admin;\n' +
                      'TITLE:CEO & Fundador;\n' +
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'X-WA-BIZ-DESCRIPTION:Desarrollador oficial de sistemas de automatización.\n' +
                      `X-WA-BIZ-NAME:${name}\n` +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            },
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                  //  title: `${name} ✅`,
                   // body: 'Official Business Account',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771123381140_9u4BT8HVp.jpeg',
                    sourceUrl: `https://wa.me/${myNumber}`,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                },
                businessOwnerJid: myJid
            }
        }, { 
            quoted: {
                key: { 
                    fromMe: false, 
                    participant: '0@s.whatsapp.net', 
                    remoteJid: 'status@broadcast' 
                },
                message: {
                    contactMessage: {
                        displayName: name,
                        vcard: vcard
                    }
                }
            } 
        })
        
        await m.react('🛡️')
    }
}

export default ownerCommand
