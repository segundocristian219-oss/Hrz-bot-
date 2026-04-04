const handler = {
    name: 'creador',
    alias: ['owner', 'contacto', 'devs', 'developer', 'desarrolladores', 'soporte'],
    category: 'main',
    run: async (m, { conn, command }) => {
        const isOwner = ['owner', 'creador', 'contacto'].includes(command)
        
        if (isOwner) {
            const myNumber = '50432955554'
            const brandName = '𝑫𝒆𝒚𝒍𝒊𝒏 𝑬𝒍𝒊𝒂𝒄 ♛'
            const vcard = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${brandName}\n` +
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
                    businessOwnerJid: myNumber + '@s.whatsapp.net'
                }
            }, { quoted: m })
            await m.react('🔘')

        } else {
            const num1 = '584228028583'
            const num2 = '5493772455367'
            const name1 = 'ϛαριϛυγ ♛'
            const name2 = 'AlexDev09 ♛'

            const vcard1 = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${name1}\n` +
                          'ORG:KiritoBot-MD Developer;\n' +
                          'TITLE:Chief Executive Officer;\n' +
                          `TEL;type=CELL;type=VOICE;waid=${num1}:${num1}\n` +
                          'X-WA-BIZ-DESCRIPTION:programador, owner y desarrollador principal del bot.\n' +
                          `X-WA-BIZ-NAME:${name1}\n` +
                          'END:VCARD'

            const vcard2 = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${name2}\n` +
                          'ORG:KiritoBot-MD Developer;\n' +
                          'TITLE:Chief Executive Officer;\n' +
                          `TEL;type=CELL;type=VOICE;waid=${num2}:${num2}\n` +
                          'X-WA-BIZ-DESCRIPTION:manejo de bots y scrappers.\n' +
                          `X-WA-BIZ-NAME:${name2}\n` +
                          'END:VCARD'

            await conn.sendMessage(m.chat, {
    text: 'Equipo de Desarrollo KiritoBot',
    contextInfo: {
        externalAdReply: {
            title: 'KiritoBot-MD™ OFFICIAL CONTACTS',
            body: 'KiritoBot-MD Development Team',
            thumbnailUrl: img(),
            sourceUrl: `https://wa.me/${num1}`,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true
        },
        contacts: {
            displayName: 'Equipo de Desarrollo KiritoBot',
            contacts: [{ vcard: vcard1 }, { vcard: vcard2 }]
        },
        businessOwnerJid: num1 + '@s.whatsapp.net'
    }
}, { quoted: m })

            await m.react('👑')
        }
    }
}

export default handler
