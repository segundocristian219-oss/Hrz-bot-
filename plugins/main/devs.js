const devsCommand = {
    name: 'devs',
    alias: ['developer', 'desarrolladores', 'soporte'],
    category: 'main',
    run: async (m, { conn }) => {
        // --- 1. PRIMER DESARROLLADOR (Sebastian Herrera,/ alias:capicuy) ---
        const myNumber1 = '584228028583'
        const myJid1 = myNumber1 + '@s.whatsapp.net'
        const brandName1 = 'ϛαριϛυγ ♛' 

        const vcard1 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName1}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber1}:${myNumber1}\n` +
                      'X-WA-BIZ-DESCRIPTION:programador, owner y desarrollador principal del bot.\n' +
                      `X-WA-BIZ-NAME:${brandName1}\n` +
                      'END:VCARD'

        // --- 2. SEGUNDO DESARROLLADOR (Copia exacta por ahora) ---
        const myNumber2 = '5493772455367'
        const myJid2 = myNumber2 + '@s.whatsapp.net'
        const brandName2 = 'AxelDev09 ♛' 

        const vcard2 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName2}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber2}:${myNumber2}\n` +
                      'X-WA-BIZ-DESCRIPTION:programador de scrapers y manejo de bots.\n' +
                      `X-WA-BIZ-NAME:${brandName2}\n` +
                      'END:VCARD'

        // --- ENVÍO DEL MENSAJE ---
        await conn.sendMessage(m.chat, {
            contacts: {
                // WhatsApp mostrará este nombre general en la cabecera del mensaje
                displayName: 'Equipo de Desarrollo', 
                // Aquí es donde sucede la magia: pasamos ambos vcards en el array
                contacts: [{ vcard: vcard1 }, { vcard: vcard2 }] 
            },
            contextInfo: {
                externalAdReply: {
                    title: 'Ϛαριϛυγ™ OFFICIAL CONTACTS',
                    body: 'KiritoBot-MD Development Team',
                    thumbnailUrl: img(), 
                    sourceUrl: `https://wa.me/${myNumber1}`,
                    mediaType: 1,
                    showAdAttribution: false, 
                    renderLargerThumbnail: true
                },
                businessOwnerJid: myJid1 
            }
        }, { 
            quoted: m 
        })
        
        await m.react('👑') 
    }
}

export default devsCommand
            
