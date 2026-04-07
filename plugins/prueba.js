import pkg from '@ryuu-reinzz/button-helper';
// Esta línea asegura que encontremos la función sin importar cómo esté exportada
const createInteractiveMessage = pkg.createInteractiveMessage || pkg.default?.createInteractiveMessage || pkg.default;

import pkgBaileys from '@whiskeysockets/baileys';
const { generateMessageID } = pkgBaileys;

const interactiveTestCommand = {
    name: 'testbtn',
    alias: ['botones'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            // Verificación de seguridad en consola
            if (typeof createInteractiveMessage !== 'function') {
                throw new Error('La función createInteractiveMessage no se cargó correctamente.');
            }

            const interactive = createInteractiveMessage({
                body: "✅ *SISTEMA V7 VINCULADO*\n\nSi ves esto, la importación dinámica funcionó.",
                footer: "KIRITO BOT",
                header: { title: "CONTROL DE MÓDULOS", hasMediaAttachment: false },
                buttons: [
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({ display_text: "ACEPTAR", id: "ok" })
                    }
                ]
            });

            await conn.relayMessage(m.chat, { interactiveMessage: interactive }, { 
                messageId: generateMessageID(),
                additionalNodes: [{ tag: 'biz', attrs: {} }]
            });

        } catch (err) {
            console.error('❌ Error en el comando:', err.message);
            // Opcional: te avisa en WhatsApp si falló la función
            await conn.sendMessage(m.chat, { text: `❌ Error técnico: ${err.message}` }, { quoted: m });
        }
    }
};

export default interactiveTestCommand;
