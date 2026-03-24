import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const testBotones = {
    name: 'testbotones',
    alias: ['testb'],
    category: 'debug',
    run: async (m, { conn }) => {
        try {
            await m.react('🕒');
            const img = 'https://api.dix.lat/media/img_1774325670603_TYbdEngBM.jpg';
            const media = await prepareWAMessageMedia({ image: { url: img } }, { upload: conn.waUploadToServer });

            // --- ESTRUCTURA 1: BOTONES DE LISTA (LOS MÁS COMPATIBLES) ---
            const listMsg = generateWAMessageFromContent(m.chat, {
                listMessage: {
                    title: "OPCIÓN 1: LISTA",
                    description: "Haz clic abajo para ver el menú",
                    buttonText: "Abrir Menú 📂",
                    listType: 1,
                    sections: [{
                        title: "Selecciona una acción",
                        rows: [{ title: "Siguiente Meme", rowId: ".memes" }]
                    }],
                    footerText: "Voker Systems"
                }
            }, { quoted: m });
            await conn.relayMessage(m.chat, listMsg.message, { messageId: listMsg.key.id });

            // --- ESTRUCTURA 2: BOTONES DE TEXTO (LEGACY/VIEJOS) ---
            // Nota: Estos a veces fallan en iOS pero son muy ligeros
            const buttons = [
                { buttonId: '.memes', buttonText: { displayText: 'Siguiente Meme 🔄' }, type: 1 }
            ];
            const buttonMsg = {
                image: { url: img },
                caption: "OPCIÓN 2: BOTONES CLÁSICOS",
                footer: "Voker Systems",
                buttons: buttons,
                headerType: 4
            };
            await conn.sendMessage(m.chat, buttonMsg, { quoted: m });

            // --- ESTRUCTURA 3: NATIVE FLOW SIMPLIFICADO (EL QUE INTENTÁBAMOS) ---
            const nativeMsg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                            body: { text: "OPCIÓN 3: NATIVE FLOW (MODERNO)" },
                            nativeFlowMessage: {
                                buttons: [{
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({ display_text: "Siguiente 🔄", id: ".memes" })
                                }]
                            }
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, nativeMsg.message, { messageId: nativeMsg.key.id });

            await m.react('✅');
        } catch (e) {
            console.error(e);
            await m.react('❌');
            conn.reply(m.chat, `Error: ${e.message}`, m);
        }
    }
};

export default testBotones;
