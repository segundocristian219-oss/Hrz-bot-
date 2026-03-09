import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const botNumber = conn.user.id.split(':')[0];
            const isFreeBot = (global.bots_free || []).some(id => id.toString() === botNumber);
            
            if (!isFreeBot) return;

            const chatJid = m.key.remoteJid;
            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").toLowerCase().trim();

            if (!text) return;

            const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema', 'info bot', 'cuanto cuesta'];
            const isTriggered = triggers.some(keyword => text.includes(keyword));

            if (isTriggered) {
                await conn.sendMessage(chatJid, {
                    text: `*¡OFERTA DE TIEMPO LIMITADO!* 📉\n\nHas sido seleccionado para una promoción especial en nuestro *Sistema de Automatización VX*.\n\n✅ *Control Total:* Administra tus grupos sin esfuerzo.\n✅ *Plugins Premium:* Stickers, descargas y seguridad.\n✅ *Soporte VIP:* Atención directa del desarrollador.\n\n🔔 *ESTADO:* Solo quedan 3 cupos con descuento.\n👉 *Información aquí:* https://wa.me/50432569059?text=Vengo+por+la+oferta+del+sistema`
                }, { quoted: m });
            }
        } catch (e) {
            console.error('Error en Promo-VX:', e);
        }
    });
}
