import { readFileSync } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menuprueba',
    alias: ['hp'],
    category: 'main',
    run: async (m, { conn, text }) => {
        try {
            await m.react('⏳');

            const menuData = JSON.parse(readFileSync(join(process.cwd(), 'lib', 'menu.json'), 'utf-8'));
            const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
            
            let uptime = clockString(process.uptime() * 1000);
            let totalreg = await global.User.countDocuments();
            let totalchats = await global.Chat.countDocuments();
            const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇᴍ V5.8.0';

            let menuText = `╔══『 *${name()}* 』══╗\n`;
            menuText += `║ • Usuario: @${m.sender.split('@')[0]}\n`;
            menuText += `║ • Usuarios: ${totalreg}\n`;
            menuText += `║ • Grupos: ${totalchats}\n`;
            menuText += `║ • Uptime: ${uptime}\n`;
            menuText += `║ • Versión: ${pkg.version}\n`;
            menuText += `║ • dix.lat/grupo\n`;
            menuText += `╚═════════════════╝\n\n`;
            menuText += `> Muy pronto nueva versión con más funciones.\n`;
            menuText += `> Usa *#novedades* para descubrir lo nuevo del sistema.\n`;
            menuText += `${rmrText}\n\n`;

            const query = text.trim().toUpperCase();

            if (query && menuData[query]) {
                menuText += `┌──「 *${query}* 」──\n`;
                menuData[query].forEach(item => {
                    menuText += `♛ *${item.cmd}* \n> ➠${item.desc}\n`;
                });
                menuText += `└───────────────\n\n`;
            } else {
                Object.entries(menuData).forEach(([title, cmds]) => {
                    menuText += `┌──「 *${title.toUpperCase()}* 」──\n`;
                    cmds.forEach(item => {
                        menuText += `♛ *${item.cmd}* \n> ➠${item.desc}\n`;
                    });
                    menuText += `└───────────────\n\n`;
                });
            }

            menuText += `> © Powered by ${developer}.`;

            const { data: imgBuffer } = await conn.getFile(global.img2());

            await conn.sendMessage(m.chat, {
                image: imgBuffer,
                caption: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    ...channelInfo
                }
            }, { quoted: m });

            await m.react('🍃');

        } catch (error) {
            console.error(error);
            m.reply('❌ Error al generar el menú.\n\nUsa el comando *#report* para reportar esté error.');
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