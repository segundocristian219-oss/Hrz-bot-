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
                          'EMAIL;type=INTERNET:admin@dix.lat\n' +
                          'URL:https://dix.lat\n' +
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
            const num2 = '584228028583'
            const num3 = '5493772455367'
            const num1 = '50432955554'
            const name2 = 'ϛαριϛυγ ✧'
            const name1 = '𝑫𝒆𝒚𝒍𝒊𝒏 𝑬𝒍𝒊𝒂𝒄 ♛'
            const name3 = 'AlexDev09 ✰'

            const vcard1 = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${name1}\n` +
                          `ORG: Dueño y desarrollador de ${name()};\n` +
                          'TITLE:Desarrollador Principal;\n' +
                          `TEL;type=CELL;type=VOICE;waid=${num1}:${num1}\n` +
                          'END:VCARD'

            const vcard2 = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${name2}\n` +
                          'ORG:KiritoBot-MD Team;\n' +
                          'TITLE:SysAdmin & Scrapers;\n' +
                          `TEL;type=CELL;type=VOICE;waid=${num2}:${num2}\n` +
                          'END:VCARD'

            const vcard3 = 'BEGIN:VCARD\n' +
                          'VERSION:3.0\n' +
                          `FN:${name3}\n` +
                          'ORG:KiritoBot-MD Team;\n' +
                          'TITLE:SysAdmin & Scrapers;\n' +
                          `TEL;type=CELL;type=VOICE;waid=${num3}:${num3}\n` +
                          'END:VCARD'

            await conn.sendMessage(m.chat, {
                contacts: {
                    displayName: 'Equipo de Desarrollo KiritoBot',
                    contacts: [{ vcard: vcard1 }, { vcard: vcard3 }, { vcard: vcard2 }]
                },
                contextInfo: {
                    externalAdReply: {
                        title: 'KiritoBot-MD™ OFFICIAL CONTACTS',
                        body: 'Desarrollo y Soporte Técnico',
                        thumbnailUrl: img(),
                        sourceUrl: `https://wa.me/${num1}`,
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
            await m.react('👑')
        }
    }
}

export default handler
