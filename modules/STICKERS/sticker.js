import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const stickerCommand = {
    category: 'sticker',
    commands: {
        sticker: {
            name: 'sticker',
            alias: ['s', 'stiker'],
            run: async (m, { conn, args, text }) => {
                try {
                    let q = m.quoted ? m.quoted : m;
                    let mime = (q.msg || q).mimetype || '';
                    let txt = args.join(' ');

                    if (!/image|video|webp/.test(mime)) return m.reply('> *✎ Responde a una imagen o video.*');

                    if (/video/.test(mime)) {
                        let duration = q.msg?.seconds || q.seconds || 0;
                        if (duration > 7) {
                            await m.react('❌');
                            return m.reply('> *⍰ El video es demasiado largo.* La duración máxima para stickers es de *7 segundos*.');
                        }
                    }

                    await m.react('🕓');

                    let buffer = await q.download();
                    if (!buffer) return m.reply('> ⚔ Error al descargar.');

                    let bot = name(conn);
                    let user = m.pushName || 'User';
                    let [pack, auth] = txt.includes('|') ? txt.split('|').map(v => v.trim()) : [bot, user];

                    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

                    let workerResult = await dispatchMediaTask({
                        type: 'convert_sticker',
                        data: uint8Array,
                        packname: pack,
                        author: auth
                    });

                    if (!workerResult || !workerResult.buffer) {
                        throw new Error("El subproceso devolvió un contenido vacío o corrupto.");
                    }

                    await conn.sendMessage(m.chat, { 
                        sticker: workerResult.buffer,
                        contextInfo: {
                            forwardingScore: 1, 
                            isForwarded: true,
                            ...channelInfo
                        }
                    }, { quoted: m });

                    await m.react('✅');

                } catch (e) {
                    console.error(e);
                    await m.react('✖️');
                    m.reply(`> ⚔ Error en el procesamiento interno.\n\nUsa el comando *#report* para reportar esté error.\n\n${e.message}`);
                }
            }
        }
    }
};
