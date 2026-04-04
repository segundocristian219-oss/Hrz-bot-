const devsCommand = {
    name: 'devs',
    alias: ['developer', 'desarrolladores', 'soporte'],
    category: 'main',
    run: async (m, { conn }) => {
        
        // --- 1. DESARROLLADOR 1 (Sebastian Herrera, alias: capicuy) ---
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

        // --- 2. DESARROLLADOR 2 (AlexDev09)---
        const myNumber2 = '5493772455367'
        const myJid2 = myNumber2 + '@s.whatsapp.net'
        const brandName2 = 'AlexDev09 ♛' 
        const vcard2 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName2}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber2}:${myNumber2}\n` +
                      'X-WA-BIZ-DESCRIPTION:manejo de bots y scrappers.\n' +
                      `X-WA-BIZ-NAME:${brandName2}\n` +
                      'END:VCARD'

        // --- 3. DESARROLLADOR 3 (😎) ---
        const myNumber3 = '525653326435'
        const myJid3 = myNumber3 + '@s.whatsapp.net'
        const brandName3 = '😎 ♛' 
        const vcard3 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName3}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber3}:${myNumber3}\n` +
                      'X-WA-BIZ-DESCRIPTION:\n' +
                      `X-WA-BIZ-NAME:${brandName3}\n` +
                      'END:VCARD'

        // --- 4. DESARROLLADOR 4 (𝕭𝖎𝖑𝖑𝖔𝖓𝖊𝖘) ---
        const myNumber4 = '18094567434'
        const myJid4 = myNumber4 + '@s.whatsapp.net'
        const brandName4 = '𝕭𝖎𝖑𝖑𝖔𝖓𝖊𝖘 ♛' 
        const vcard4 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName4}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber4}:${myNumber4}\n` +
                      'X-WA-BIZ-DESCRIPTION:Software.\n' +
                      `X-WA-BIZ-NAME:${brandName4}\n` +
                      'END:VCARD'

        // --- 5. DESARROLLADOR 5 (Daniel) ---
        const myNumber5 = '50582908110'
        const myJid5 = myNumber5 + '@s.whatsapp.net'
        const brandName5 = 'Daniel ♛' 
        const vcard5 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName5}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber5}:${myNumber5}\n` +
                      'X-WA-BIZ-DESCRIPTION:\n' +
                      `X-WA-BIZ-NAME:${brandName5}\n` +
                      'END:VCARD'

        // --- 6. DESARROLLADOR 6 (Farguts) ---
        const myNumber6 = '5493873655135'
        const myJid6 = myNumber6 + '@s.whatsapp.net'
        const brandName6 = 'Farguts ♛' 
        const vcard6 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName6}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber6}:${myNumber6}\n` +
                      'X-WA-BIZ-DESCRIPTION:\n' +
                      `X-WA-BIZ-NAME:${brandName6}\n` +
                      'END:VCARD'

        // --- 7. DESARROLLADOR 7 (H u̖̖̖̗̗̗̠̠̠̱̱̱̩̩ s̖̗k̖y)---
        const myNumber7 = '6283191473712'
        const myJid7 = myNumber7 + '@s.whatsapp.net'
        const brandName7 = 'H u̖̖̖̗̗̗̠̠̠̱̱̱̩̩ s̖̗k̖y ♛' 
        const vcard7 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName7}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber7}:${myNumber7}\n` +
                      'X-WA-BIZ-DESCRIPTION:\n' +
                      `X-WA-BIZ-NAME:${brandName7}\n` +
                      'END:VCARD'

        // --- 8. DESARROLLADOR 8 ---
        const myNumber8 = '584228028583'
        const myJid8 = myNumber8 + '@s.whatsapp.net'
        const brandName8 = 'ϛαριϛυγ ♛' 
        const vcard8 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName8}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber8}:${myNumber8}\n` +
                      'X-WA-BIZ-DESCRIPTION:programador, owner y desarrollador principal del bot.\n' +
                      `X-WA-BIZ-NAME:${brandName8}\n` +
                      'END:VCARD'

        // --- 9. DESARROLLADOR 9 ---
        const myNumber9 = '584228028583'
        const myJid9 = myNumber9 + '@s.whatsapp.net'
        const brandName9 = 'ϛαριϛυγ ♛' 
        const vcard9 = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${brandName9}\n` + 
                      `N:;ϛαρι;ϛυγ;;\n` +
                      'ORG:KiritoBot-MD Developer;\n' + 
                      'TITLE:Chief Executive Officer;\n' + 
                      `TEL;type=CELL;type=VOICE;waid=${myNumber9}:${myNumber9}\n` +
                      'X-WA-BIZ-DESCRIPTION:programador, owner y desarrollador principal del bot.\n' +
                      `X-WA-BIZ-NAME:${brandName9}\n` +
                      'END:VCARD'

        // --- ENVÍO DEL MENSAJE CON LOS 9 CONTACTOS ---
        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: 'Equipo de Desarrollo KiritoBot', 
                contacts: [
                    { vcard: vcard1 }, 
                    { vcard: vcard2 }, 
                    { vcard: vcard3 }, 
                    { vcard: vcard4 }, 
                    { vcard: vcard5 }, 
                    { vcard: vcard6 }, 
                    { vcard: vcard7 }, 
                    { vcard: vcard8 }, 
                    { vcard: vcard9 }
                ] 
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
    
