export const botsModule = {
    category: 'owner',
    commands: {
        botss: {
            name: 'botss',
            alias: ['subbotss'],
            rowner: true,
            run: async (m, { conn }) => {
                if (!global.conns || global.conns.size === 0) {
                    return m.reply('❌ No hay sub-bots activos en este momento.');
                }

                let txt = ` ★᭄ꦿ᭄ꦿ *SUB-BOTS ACTIVOS* ★᭄ꦿ᭄ꦿ\n\n`;
                txt += `➥ Total: ${global.conns.size}\n\n`;

                let i = 1;
                const mentionedJid = [];

                for (const [id, sock] of global.conns.entries()) {
                    if (sock.user && sock.user.id) {
                        const jid = sock.user.id.split(':')[0];
                        const name = sock.user.name || 'Sub-Bot';
                        const maskedNumber = jid.slice(0);

                        txt += `╭ᯓ *${i++}.* wa.me/${maskedNumber} \n╰┄✜ (${name})\n\n`;
                        mentionedJid.push(sock.user.id);
                    }
                }

                if (mentionedJid.length === 0) {
                    return m.reply('❌ No hay sub-bots conectados actualmente.');
                }

                const thumb = typeof img === 'function' ? img(conn) : 'https://dix.lat';

                await conn.sendMessage(m.chat, { 
                    image: { url: thumb },
                    caption: txt,
                    contextInfo: { 
                        mentionedJid: mentionedJid 
                    }
                }, { quoted: m });
            }
        }
    }
};
