const promoSystem = {
    name: 'promo_pro_vx',
    category: 'system',
    async before(m, { conn }) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim().toLowerCase();

        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        const botNumber = conn.user.id.split(':')[0];
        if (!(global.bots_free || []).map(String).includes(botNumber)) return false;

        const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot', 'costo', 'cuanto vale'];
        if (!triggers.some(key => txt.includes(key))) return false;

        const ads = [
            {
                title: "POTENCIA TU GRUPO CON VX-BOT ⚡",
                footer: "La infraestructura más avanzada para la gestión de comunidades en WhatsApp. Automatización total, seguridad y más de 200 funciones activas."
            },
            {
                title: "VX-BOT: SISTEMA MULTIFUNCIONES 💎",
                footer: "Transforma la experiencia de tus usuarios con el bot más rápido del mercado. Estabilidad garantizada y soporte técnico especializado."
            },
            {
                title: "SOLUCIÓN INTEGRAL VX-BOT 🚀",
                footer: "Lleva tu grupo al siguiente nivel con herramientas exclusivas de administración, juegos y descargas. Adquiere tu licencia hoy mismo."
            }
        ];

        const selectedAd = ads[Math.floor(Math.random() * ads.length)];

        const productMessage = {
            product: {
                productImage: { url: await global.img() },
                productId: 'VX-PRO-' + Date.now(),
                title: selectedAd.title,
                description: 'Licencia profesional para sistemas multifuncionales.',
                currencyCode: 'USD',
                priceAmount1000: '19990',
                retailerId: 'VX-SYSTEMS',
                url: 'https://wa.me/50432569059?text=Hola+Deylin,+me+interesa+el+Sistema+VX',
                productImageCount: 1
            },
            businessOwnerJid: '50432569059@s.whatsapp.net',
            footer: selectedAd.footer,
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
                    newsletterName: `SISTEMA VERIFICADO: ${global.name()}`
                }
            }
        });

        return true;
    }
};

export default promoSystem;
