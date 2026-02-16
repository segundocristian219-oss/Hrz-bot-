const ownerCommand = {
    name: 'owner',
    alias: ['creador', 'contacto', 'admin'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '50432955554'
        const myJid = `${myNumber}@s.whatsapp.net`
        const pushName = (await conn.onWhatsApp(myJid))[0]?.notify || conn.user.name || 'Deylin'

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${pushName}\n` +
                      `N:;${pushName};;;\n` +
                      'ORG:SYSTEM ADMINISTRATOR\n' +
                      'TITLE:Lead Developer\n' +
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'X-WA-BIZ-DESCRIPTION:Desarrollador oficial de sistemas de automatización y extracción de datos.\n' +
                      `X-WA-BIZ-NAME:${pushName}\n` +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: pushName,
                contacts: [{ vcard }]
            },
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🛡️ ${pushName.toUpperCase()} OFFICIAL SYSTEM`,
                    body: 'VERIFIED BUSINESS ACCOUNT',
                    thumbnailUrl: 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771123381140_9u4BT8HVp.jpeg',
                    sourceUrl: `https://wa.me/${myNumber}`,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true,
                    sourceId: 'Verified Business Account',
                    mediaUrl: `https://wa.me/${myNumber}`,
                    containsAutoReply: true
                },
                businessOwnerJid: myJid,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363160031023229@newsletter',
                    serverMessageId: '',
                    newsletterName: 'Deylin'
                },
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
                        displayName: pushName,
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
