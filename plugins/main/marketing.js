const promoSystem = {
    name: 'promo_pro_vx',
    category: 'system',
    async before(m, { conn }) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim().toLowerCase();

        if (!txt || m.isBaileys || m.fromMe) return false;

        const botNumber = conn.user.id.split(':')[0];
        if (!(global.bots_free || []).map(String).includes(botNumber)) return false;

        const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot', 'costo', 'cuanto vale', 'vende'];
        const isTriggered = triggers.some(key => txt.includes(key));

        if (isTriggered) {
            const ads = [
                {
                    title: "POTENCIA TU GRUPO CON VX-BOT ⚡",
                    footer: "La infraestructura más avanzada para la gestión de comunidades. Automatización total, seguridad y más de 200 funciones activas."
                },
                {
                    title: "VX-BOT: SISTEMA MULTIFUNCIONES 💎",
                    footer: "Transforma la experiencia de tus usuarios con el bot más rápido del mercado. Estabilidad garantizada y soporte técnico especializado."
                },
                {
                    title: "SOLUCIÓN INTEGRAL VX-BOT 🚀",
                    footer: "Lleva tu grupo al siguiente nivel con herramientas exclusivas de administración, juegos y descargas. Adquiere tu licencia hoy mismo."
                },
                {
                    title: "ADMINISTRACIÓN PROFESIONAL VX 🛡️",
                    footer: "El aliado perfecto para moderadores. Control de enlaces, antispam y herramientas de entretenimiento en un solo paquete tecnológico."
                },
                {
                    title: "VX-BOT: INNOVACIÓN Y VELOCIDAD 🛠️",
                    footer: "Optimizado para responder al instante. No permitas que la gestión de tu grupo sea lenta; automatiza procesos con tecnología de punta."
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
                    url: 'https://wa.me/50432569059?text=Hola+Voker+platform,+me+interesa+el+Sistema+vx',
                    productImageCount: 1
                },
                businessOwnerJid: '50432569059@s.whatsapp.net',
                footer: selectedAd.footer,
                mentions: [m.sender]
            };

            await conn.sendMessage(m.chat, productMessage, { 
                quoted: null,
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
        return false;
    }
};

export default promoSystem;