const ownerCommand = {
    name: 'owner',
    alias: ['creador', 'contacto'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '50432955554' 
        const name = 'Deylin'
        
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${name}\n` +
                      `ORG:System Administrator;\n` +
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            },
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: 'Deylin | System Admin',
                    body: 'Official Verified Account',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771123381140_9u4BT8HVp.jpeg',
                    sourceUrl: `https://wa.me/${myNumber}`,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true,
                    sourceId: 'Verified Business Account',
                    containsAutoReply: true
                },
                mentionedJid: [m.sender]
            }
        }, { 
            quoted: {
                key: { 
                    participant: '0@s.whatsapp.net', 
                    remoteJid: 'status@broadcast' 
                },
                message: {
                    contactMessage: {
                        displayName: name,
                        vcard: vcard,
                        contextInfo: { isForwarded: true }
                    }
                }
            } 
        })
        
        await m.react('✅')
    }
}

export default ownerCommand
