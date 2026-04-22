import { downloadMediaMessage } from '@whiskeysockets/baileys';

const readOnceCommand = {
    name: 'readviewonce',
    alias: ['ver', 'read', 'vv'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        
        const msg = q.message?.viewOnceMessageV2?.message || q.message?.viewOnceMessage?.message || q.message;

        if (!msg) return;

        const type = Object.keys(msg)[0];
        
        if (!/image|video|audio/.test(type)) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un mensaje de "una sola vez".');

        if (!msg[type]?.mediaKey || !msg[type]?.url) {
            return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Los datos de este archivo han expirado o no son accesibles.');
        }

        try {
            await m.react('👁️');

            const buffer = await downloadMediaMessage(
                { message: msg }, 
                'buffer',
                {},
                { 
                    reusedStaticNetworkKey: true,
                    logger: pino({ level: 'silent' }) 
                }
            ).catch(() => null);

            if (!buffer || buffer.length === 0) {
                await m.react('✖️');
                return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo descargar el contenido. Reintenta.');
            }

            const originalCaption = msg[type]?.caption || '';
            const caption = originalCaption ? `❖ 𝗧𝗘𝗫𝗧𝗢: ${originalCaption}` : `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Contenido revelado`;

            const options = { quoted: m };

            if (/video/.test(type)) {
                await conn.sendMessage(m.chat, { video: buffer, caption }, options);
            } else if (/image/.test(type)) {
                await conn.sendMessage(m.chat, { image: buffer, caption }, options);
            } else if (/audio/.test(type)) {
                await conn.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: 'audio/mp4', 
                    ptt: true 
                }, options);
            }

            await m.react('✅');

        } catch (e) {
            await m.react('❌');
            m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: El archivo ha expirado o falló la descarga.');
        }
    }
};

export default readOnceCommand;
