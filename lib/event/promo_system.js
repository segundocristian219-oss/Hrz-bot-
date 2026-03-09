import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const text = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                ""
            ).toLowerCase().trim();

            const triggers = ['venta', 'comprar', 'precio', 'adquirir', 'sistema'];
            const isTriggered = triggers.some(key => text.includes(key));

            if (isTriggered) {
                await conn.sendMessage(m.key.remoteJid, {
                    text: `*¡OFERTA DE TIEMPO LIMITADO!* 📉\n\nAdquiere tu propio *Sistema de Automatización VX*.\n\n✅ Control Total\n✅ Plugins Premium\n✅ Soporte VIP\n\n👉 Info aquí: https://wa.me/50432569059`
                }, { quoted: m });
            }
        } catch (e) {
            // Error silencioso para no llenar la consola
        }
    });
}
