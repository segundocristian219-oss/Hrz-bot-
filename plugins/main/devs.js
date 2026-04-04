const devsCommand = {
    name: 'devs',
    alias: ['developer', 'creadora', 'owner', 'soporte'],
    category: 'main',
    run: async (m, { conn }) => {
        const myNumber = '5842228583'
        const myJid = myNumber + '@s.whatsapp.net'
        const brandName = '𝑺𝒐𝒑𝒉𝒊𝒂 𝑳𝒖𝒈𝒐 ♛' 

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName}\n` + 
                      `N:;Lugo;Sophia;;\n` +
                      'ORG:YukiBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber}:${myNumber}\n` +
                      'X-WA-BIZ-DESCRIPTION:Desarrollo de sistemas de automatización y gestión de bots.\n' +
                      `X-WA-BIZ-NAME:${brandName}\n` +
                      'END:VCARD'

        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: brandName,
                contacts: [{ vcard }]
            },
            contextInfo: {
                externalAdReply: {
                    title: 'SOPHIA™ OFFICIAL CONTACT',
                    body: 'YukiBot-MD Development Team',
                    thumbnailUrl: img(), // Asegúrate de que img() esté definido en tu global
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

        await m.react('👑') 
    }
}

export default devsCommand
