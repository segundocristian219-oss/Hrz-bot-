import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import webpmux from 'node-webpmux';
import fetch from 'node-fetch';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Añade Metadatos (EXIF) al sticker para el branding de VOKER Platform
 */
async function addExif(imageBuffer, packname, author, categories = ['🤩']) {
    const img = new webpmux.Image();
    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'emojis': categories
    };

    const exifHeader = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifHeader, jsonBuffer]);
    
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    
    await img.load(imageBuffer);
    img.exif = exif;
    return await img.save(null);
}

/**
 * Procesa el emoji para convertirlo en un sticker animado de alta calidad
 */
async function processEmoji(buffer) {
    return await sharp(buffer, { animated: true })
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ loop: 0, quality: 50, lossless: false })
        .toBuffer();
}

const emojiCommand = {
    name: 'emo',
    alias: ['emoji'],
    category: 'tools',
    run: async (m, { conn, args, text }) => {
        try {
            let emoji = args[0];
            if (!emoji) return m.reply('> *✎ Ingrese un emoji junto con el comando.*');

            await m.react('🕓');

            // Formatear el código unicode del emoji para la API de Google
            let codePoint = emoji.includes('1f') ? emoji : [...emoji].map(e => e.codePointAt(0).toString(16))[0];
            
            // URL de la API de Google Noto Emoji para stickers de alta calidad
            const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoint}/512.gif`;
            
            const response = await fetch(url);
            if (!response.ok) return m.reply('> ⚔ No encontré la animación para ese emoji.');

            const buffer = await response.buffer();
            const processedSticker = await processEmoji(buffer);

            // Manejo de Packname y Autor
            let [pack, auth] = text.includes('|') 
                ? text.split('|').map(v => v.trim()) 
                : [typeof name === 'function' ? name() : 'GUILTY CROWN — VX', m.pushName];

            const finalSticker = await addExif(processedSticker, pack, auth);

            await conn.sendMessage(m.chat, { 
                sticker: finalSticker 
            }, { 
                quoted: m,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406846602793@newsletter',
                        serverMessageId: 100,
                        newsletterName: 'GUILTY CROWN — VX'
                    }
                }
            });

            await m.react('✅');

        } catch (error) {
            console.error(error);
            await m.react('✖️');
            m.reply('> ⚔ Error en la conversión: ' + error.message);
        }
    }
};

export default emojiCommand;
