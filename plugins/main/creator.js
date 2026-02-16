const ownerCommand = {
    name: 'owner',
    alias: ['creador', 'contacto', 'admin'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '50432955554' 
        const myJid = `${myNumber}@s.whatsapp.net`
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${conn.user.name || 'Deylin'}\n` +
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'X-WA-BIZ-DESCRIPTION:Administrador y desarrollador de sistemas.\n' +
                      'X-WA-BIZ-NAME:Deylin Dev\n' +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: conn.user.name || 'Deylin',
                contacts: [{ 
                    vcard,
                    vcard: vcard.replace('FN:', `FN:${conn.user.name || 'Deylin'}`) 
                }]
            },
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                   // title: 'OFFICIAL BUSINESS ACCOUNT',
                   // body: 'System Administrator - Verified',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771123381140_9u4BT8HVp.jpeg',
                    sourceUrl: `https://wa.me/${myNumber}`,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true,
                   // sourceId: 'Verified Business Account',
                    mediaUrl: `https://wa.me/${myNumber}`
                },
                businessOwnerJid: myJid,
                mentionedJid: [m.sender]
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
                        displayName: conn.user.name || 'Deylin',
                        vcard: vcard,
                        contextInfo: { 
                            isForwarded: true,
                            businessOwnerJid: myJid
                        }
                    }
                }
            } 
        })
        
        await m.react('🛡️')
    }
}

export default ownerCommand
