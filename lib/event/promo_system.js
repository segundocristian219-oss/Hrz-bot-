
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            
            const botId = conn.user.id.split(':')[0];
            if (!(global.bots_free || []).includes(botId)) return;

            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").toLowerCase().trim();

            if (!text) return;

            
            const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot', 'cuanto cuesta'];
            const isTriggered = triggers.some(keyword => text.includes(keyword));

            if (isTriggered) {
                
                this.promo_cache = this.promo_cache || {};
                const lastSent = this.promo_cache[m.key.remoteJid] || 0;
                if (Date.now() - lastSent < 3600000) return;

                
                await conn.sendMessage(m.key.remoteJid, {
                    text: `*¡OFERTA DE TIEMPO LIMITADO!* 📉\n\n` +
                          `Has sido seleccionado para una promoción especial en nuestro *Sistema de Automatización VX*.\n\n` +
                          `✅ *Control Total:* Administra tus grupos sin esfuerzo.\n` +
                          `✅ *Plugins Premium:* Stickers, descargas y seguridad.\n` +
                          `✅ *Soporte VIP:* Atención directa del desarrollador.\n\n` +
                          `🔔 *ESTADO:* Solo quedan 3 cupos con descuento.\n` +
                          `👉 *Toca el botón o link de abajo para reclamar tu precio especial.*`,
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
                            body: "Sistema VX-Bot: La mejor inversión para tu comunidad.",
                            mediaType: 1,
                            previewType: 0,
                            renderLargerThumbnail: true,
                            thumbnail: await getBuffer(global.img()), 
                            sourceUrl: "https://wa.me/50432569059?text=Vengo+por+la+oferta+del+sistema"
                        }
                    }
                }, { quoted: m });

                
                this.promo_cache[m.key.remoteJid] = Date.now();
            }

        } catch (e) {
            console.error('Error en Evento Promo-VX:', e);
        }
    });
}
