import axios from 'axios';

const testViewPlugin = {
    name: 'testview',
    alias: ['pv', 'previewtest'],
    category: 'tools',
    admin: false, // Lo dejamos abierto para que puedas probarlo tú mismo
    group: false,
    run: async (m, { conn, text }) => {
        // 1. Definimos una URL de imagen random para la vista previa
        const imageUrl = "https://picsum.photos/800/600";
        
        // 2. Obtenemos el buffer de la imagen (necesario para el thumbnail)
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // 3. Estructura exacta que solicitaste replicar
        const msg = {
            extendedTextMessage: {
                text: `❀ *MENSAJE DE PRUEBA*\n\t✰ @${m.sender.split('@')[0]}\n\nEste es un test de diseño para tu nuevo sistema de automatización.\n\n> ✐ Estado: *Operativo*\n> 🜸 https://github.com/DeylinQ/`,
                matchedText: "https://github.com/DeylinQ/",
                description: "Deylin | Automation & Web Scrapping",
                title: "System Test | Preview Design",
                previewType: "NONE",
                jpegThumbnail: buffer, // El buffer de la imagen random
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 1,
                    isForwarded: true,
                    // externalAdReply es lo que genera la tarjeta visual en la mayoría de versiones de WA
                    externalAdReply: {
                        title: "System Test | Preview Design",
                        body: "Made with ❤️ by Deylin",
                        mediaType: 1,
                        thumbnail: buffer,
                        sourceUrl: "https://github.com/DeylinQ/",
                        renderLargerThumbnail: false // Cambiar a true si quieres que la imagen se vea grande
                    }
                }
            }
        };

        // 4. Enviamos usando relayMessage para respetar la estructura cruda del JSON detectado
        return conn.relayMessage(m.chat, msg, { quoted: m });
    }
};

export default testViewPlugin;
