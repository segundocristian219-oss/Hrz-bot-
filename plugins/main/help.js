import { promises } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'comandos', 'h'],
    category: 'main',
    run: async (m, { conn, usedPrefix }) => {
        try {
            await m.react('⏳');
            
            let uptime = clockString(process.uptime() * 1000);
            
            let totalreg = await global.User.countDocuments();
            let totalCommands = Object.keys(global.plugins || {}).length;
            
            const subBots = (global.conns || []).filter(c => 
                c.user && c.ws?.socket?.readyState !== 3 
            ).length;

            const nameBot = typeof global.name === 'function' ? global.name();
            const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇᴍ V3.0';

            let menuText = `╔══『 *${nameBot.toUpperCase()}* 』══╗\n`;
            menuText += `║ ❑ *Usuario:* @${m.sender.split('@')[0]}\n`;
            menuText += `║ ❐ *Usuarios:* ${totalreg}\n`;
            menuText += `║ ❑ *Uptime:* ${uptime}\n`;
            menuText += `║ ❐ *Nodos:* ${subBots}\n`;
            menuText += `╚═════════════════╝\n\n`;

            menuText += `*${rmrText}*\n\n`;

            const categories = [
                {
                    title: '🌟 MAIN',
                    cmds: ['.menu', '.bots', '.code', '.creador']
                },
                {
                    title: '🎮 FUN',
                    cmds: ['.gay', '.meme']
                },
                {
                    title: '📥 DOWNLOAD',
                    cmds: ['.play', '.play2', '.facebook', '.instagram', '.tiktok']
                },
                {
                    title: '⛩️ ANIME',
                    cmds: ['.kill', '.kiss', '.kiss2', '.hug', '.hello', '.coffee', '.angry', '.happy', '.sad', '.slap', '.laugh']
                },
                {
                    title: '🧠 INTELIGENCIA ARTIFICIAL',
                    cmds: ['.imgg', '.ia', '.tts', '.chatgpt', '.cat']
                },
                {
                    title: '🛡️ GROUP CONFIG',
                    cmds: ['.antisub', '.antilink', '.antiestados', '.config_group', '.hidetag', '.setwelcome', '.todos', '.setpp', '.setname', '.setdesc', '.delwelcome', '.welcome on/off', '.detect on/off', '.kick', '.link', '.open/close', '.mute/unmute']
                },
                {
                    title: '🎨 STICKERS',
                    cmds: ['.s', '.wm', '.brat', '.qc', '.emo', '.emojimix', '.sticker']
                },
                {
                    title: '🔍 SEARCH',
                    cmds: ['.pinterest', '.ttss', '.gif', '.ytsearch']
                },
                {
                    title: '🛠️ TOOLS',
                    cmds: ['.get', '.upload', '.read', '.ver', '.whatmusic', '.traducir', '.qr', '.acortar', '.toimg', '.pfp', '.reducir', '.ssweb']
                },
                {
                    title: '👑 OWNER',
                    cmds: ['.await', '.restart', '.ds', '.up']
                }
            ];

            categories.forEach(cat => {
                menuText += `┌──『 *${cat.title}* 』\n`;
                cat.cmds.forEach(cmd => {
                    menuText += `│ ▫️ ${cmd}\n`;
                });
                menuText += `└───────────────\n\n`;
            });

            menuText += `> © Powered by VOKER Platform.`;

            await conn.sendMessage(m.chat, { 
                text: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: `\t\t\t\t\t\t\t\t${nameBot}`,
                        body: 'Mᴇɴᴜ́ ᴅᴇ Cᴏᴍᴀɴᴅᴏs Iɴᴛᴇʀᴀᴄᴛɪᴠᴏs',
                        thumbnailUrl: (typeof global.img === 'function' ? global.img() : 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1771018082759_bwnA5OM5c.jpeg'), 
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            await m.react('🍃');

        } catch (error) {
            console.error(error);
            m.reply('❌ Error al generar el menú.');
        }
    }
};

export default menuCommand;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
