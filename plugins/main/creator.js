const ownerCommand = {
    name: 'owner',
    alias: ['creador', 'contacto', 'soporte'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '50432955554'
        const myJid = myNumber + '@s.whatsapp.net'
        const brandName = '𝑫𝒆𝒚𝒍𝒊𝒏 𝑬𝒍𝒊𝒂𝒄 ♛' 

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName}\n` + 
                      `N:;VGT;xh;;\n` +
                      'ORG:VGT KTY CEL.;\n' + 
                      'TITLE:Chief Technical Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'X-WA-BIZ-DESCRIPTION:Infraestructura digital y sistemas de automatización de alto rendimiento.\n' +
                      `X-WA-BIZ-NAME:${brandName}\n` +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: brandName,
                contacts: [{ vcard }]
            },
            contextInfo: {
                
                externalAdReply: {
                    title: 'DEYLIN™ OFFICIAL CONTACT',
                    body: 'Advanced Automation Infrastructure',
                    thumbnailUrl: img(),
                    sourceUrl: `https://wa.me/${myNumber}`,
                    mediaType: 1,
                    showAdAttribution: false, 
                    renderLargerThumbnail: true
                },
                businessOwnerJid: myJid
            }
        }, { 
            quoted: m 
        })

        await m.react('🔘') 
    }
}

export default ownerCommand
