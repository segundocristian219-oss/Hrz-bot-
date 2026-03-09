const promoSystem = {
    name: 'promo_product_vx',
    category: 'system',
    async before(m, { conn }) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim().toLowerCase();

        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        const botNumber = conn.user.id.split(':')[0];
        if (!(global.bots_free || []).map(String).includes(botNumber)) return false;

        const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot', 'costo'];
        if (!triggers.some(key => txt.includes(key))) return false;

        const productMessage = {
            product: {
                productImage: { url: await global.img() },
                productId: '2452968910',
                title: 'SISTEMA DE AUTOMATIZACIÓN VX',
                description: 'La mejor herramienta para gestionar tus grupos y ventas 24/7.',
                currencyCode: 'USD',
                priceAmount1000: '0',
                retailerId: 'VX-BOT-PRO',
                url: 'https://wa.me/50432569059',
                productImageCount: 1
            },
            businessOwnerJid: '50432569059@s.whatsapp.net',
            caption: `*¡OFERTA DE TEMPO LIMITADO!* 📉\n\nHas sido seleccionado para una promoción especial.\n\n✅ Control Total\n✅ Plugins Premium\n✅ Soporte VIP\n\n🔔 *ESTADO:* Solo quedan 3 cupos con descuento.`.trim(),
            footer: 'Toca el producto para más información',
            mentions: [m.sender]
        };

        await conn.sendMessage(m.chat, productMessage, { 
            quoted: m,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406846602793@newsletter',
                    serverMessageId: 100,
                    newsletterName: `MARKETPLACE: ${global.name()}`
                }
            }
        });

        return true;
    }
};

export default promoSystem;
