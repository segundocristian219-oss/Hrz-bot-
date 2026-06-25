export const ventasCommand = {
    category: 'tienda',
    commands: {
        ventas: {
            name: 'ventas',
            alias: ['comprar', 'planes', 'alquilar'],
            run: async function (m, { conn }) {
                const i = global.img(conn);
                
                const textoVentas = `🛒 *PLANES VIP - KIRITO BOT NETWORK*\n\n` +
                    `¡Potencia tu grupo al máximo nivel! Elige uno de nuestros pases premium y disfruta de estabilidad y velocidad sin límites.\n\n` +
                    `🔹 *[01] VINCULACIÓN PREMIUM*\n` +
                    `• *Beneficio:* Acceso completo por 30 días.\n` +
                    `• *Inversión:* $10 USD / 1er mes\n\n` +
                    `🔸 *[02] PASE TRIMESTRAL GOLD*\n` +
                    `• *Beneficio:* Ahorra comprando 3 meses juntos.\n` +
                    `• *Inversión:* $20 USD / 3 meses\n\n` +
                    `💎 *[03] PASE ANUAL PREMIUM*\n` +
                    `• *Beneficio:* Acceso total por un año completo.\n` +
                    `• *Inversión:* $60 USD / Año\n\n` +
                    `➔ _Presiona los botones de abajo para proceder con la compra o hablar directamente con el encargado de ventas._`;

                const botones = [
                    { text: '🌐 Sitio Web VIP', url: 'https://dix.lat/planes' },
                    { text: '💬 Contactar Vendedor', url: 'https://wa.me/50432955554?text=Hola,%20deseo%20adquirir%20un%20plan%20VIP%20para%20el%20bot' }
                ];

                const opciones = {
                    title: "亗  PLANES VIP DISPONIBLES  亗",
                    footer: "Kirito-Bot MD • Network",
                    quoted: m,
                    image: i
                };

                try {
                    await conn.sendButtonMessage(m.chat, textoVentas, botones, opciones);
                } catch (err) {
                    console.error(err);
                    await m.reply("Error en la ejecución del comando de ventas:\n\n" + err.message);
                }
            }
        }
    }
};
