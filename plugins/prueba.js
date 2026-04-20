import { proto } from '@whiskeysockets/baileys';

const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre de un paquete de stickers.');

        try {
            await m.react('🕒');

            // Generamos una key única para el mensaje
            const id = Math.random().toString(36).slice(2, 12).toUpperCase();
            const key = {
                remoteJid: m.chat,
                fromMe: true,
                id: id,
            };

            // Construimos el proto raw del stickerPackMessage vacío
            const message = {
                stickerPackMessage: {
                    title: text.trim() || 'Pack de Prueba',
                    publisherName: 'Bot',
                    stickerPackId: 'test-pack-001',
                    stickers: [],   // vacío por ahora
                    caption: null,
                }
            };

            // Enviamos con relayMessage (bypass de sendMessage)
            await conn.relayMessage(m.chat, message, {
                messageId: id,
                quoted: m,
            });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            console.error(e);
            m.reply('Error: ' + e.message);
        }
    }
};

export default stickerPackSearch;