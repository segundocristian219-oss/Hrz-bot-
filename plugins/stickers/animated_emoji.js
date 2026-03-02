
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import WebpMux from 'node-webpmux';
import fetch from 'node-fetch';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function addExif(webpBuffer, packname, author, emojis = ['🤩']) {
  const img = new WebpMux.Image();
  const packInfo = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'emojis': emojis
  };

  const header = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x16, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  const jsonBuf = Buffer.from(JSON.stringify(packInfo), 'utf8');
  const exif = Buffer.concat([header, jsonBuf]);
  exif.writeUIntLE(jsonBuf.length, 14, 4);

  await img.load(webpBuffer);
  img.exif = exif;
  await img.save(null);
}

async function processEmoji(buffer) {
  return await sharp(buffer, { animated: true })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ loop: 0, quality: 50, lossless: false })
    .toBuffer();
}

const emojiCommand = {
  name: 'emoji',
  alias: ['emo'],
  category: 'tools',
  run: async (m, { conn, args, text }) => {
    try {
      let input = args[0];
      if (!input) return m.reply('> *✎ Ingresa ese emoji junto con el comando.');

      await m.react('🕓');

      let emojiCode = input.includes('1f')
        ? input
        : [...input].map(c => c.codePointAt(0).toString(16)).join('-');

      const url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/' + emojiCode + '/512.gif';
      const response = await fetch(url);

      if (!response.ok) return m.reply('> ⚔ No encontré la animación para ese emoji.');

      const buffer = await response.buffer();
      const webp = await processEmoji(buffer);

      let [packname, author] = text.includes('|')
        ? text.split('|').map(s => s.trim())
        : [name, m.pushName];

      const sticker = await addExif(webp, packname, author);
                  await conn.sendMessage(m.chat, { 
                sticker: sticker,
                contextInfo: {
                    forwardingScore: 1, 
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406846602793@newsletter',
                        serverMessageId: 100,
                        newsletterName: name()
                    }
                }
            }, { quoted: m });
      await m.react('✅');

    } catch (e) {
      console.error(e);
      await m.react('✖️');
      m.reply('> ⚔ Error en la versión: ' + e.toString());
    }
  }
};

export default emojiCommand;