const promoSystem = {
    name: 'promo_vx',
    category: 'system',
    async before(m, { conn }) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim().toLowerCase();

        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        const botNumber = conn.user.id.split(':')[0];
        const isFreeBot = (global.bots_free || []).some(id => id.toString() === botNumber);
        if (!isFreeBot) return false;

        const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot'];
        const isTriggered = triggers.some(key => txt.includes(key));

        if (isTriggered) {
            await conn.sendMessage(m.chat, {
                text: `*¡OFERTA DE TIEMPO LIMITADO!* 📉\n\nHas sido seleccionado para una promoción especial en nuestro *Sistema de Automatización VX*.\n\n✅ *Control Total:* Administra tus grupos sin esfuerzo.\n✅ *Plugins Premium:* Stickers, descargas y seguridad.\n✅ *Soporte VIP:* Atención directa del desarrollador.\n\n🔔 *ESTADO:* Solo quedan 3 cupos con descuento.\n👉 *Toca el enlace abajo para reclamar tu precio especial.*`,
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
            }, { quoted: m });
            return true;
        }
        return false;
    }
};

export default promoSystem;
