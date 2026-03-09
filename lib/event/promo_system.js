export async function before(m, { conn }) {
    if (!m.text || m.fromMe) return !1

    const botNumber = conn.user.id.split(':')[0]
    const isFreeBot = (global.bots_free || []).some(id => id.toString() === botNumber)
    
    if (!isFreeBot) return !1

    const text = m.text.toLowerCase()
    const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot']
    const isTriggered = triggers.some(key => text.includes(key))

    if (isTriggered) {
        await conn.sendMessage(m.chat, {
            text: `*¡OFERTA DE TIEMPO LIMITADO!* 📉\n\nAdquiere tu propio *Sistema de Automatización VX*.\n\n✅ Control Total\n✅ Plugins Premium\n✅ Soporte VIP\n\n👉 Info aquí: https://wa.me/50432569059`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406846602793@newsletter',
                    serverMessageId: 100,
                    newsletterName: `📢 OFERTA: ${global.name()}`
                },
                externalAdReply: {
                    title: "🚨 ¡OFERTA FLASH: 50% OFF!",
                    body: "Sistema VX-Bot: La mejor inversión",
                    mediaType: 1,
                    previewType: 0,
                    renderLargerThumbnail: true,
                    thumbnail: await global.getBuffer(global.img()),
                    sourceUrl: "https://wa.me/50432569059?text=Vengo+por+la+oferta"
                }
            }
        }, { quoted: m })
    }

    return !0
}
