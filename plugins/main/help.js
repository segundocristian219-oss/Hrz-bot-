import { readFileSync, watchFile } from 'fs';
import { join } from 'path';

const menuPath = join(process.cwd(), 'lib', 'menu.json');
const pkgPath = join(process.cwd(), 'package.json');

let menuData = JSON.parse(readFileSync(menuPath, 'utf-8'));
let pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

watchFile(menuPath, () => {
    menuData = JSON.parse(readFileSync(menuPath, 'utf-8'));
});

const menuCommand = {
    name: 'menu',
    alias: ['help', 'comandos', 'h'],
    category: 'main',
    run: async (m, { conn, text }) => {
        try {
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
            menuText += `> Usa *#code* para convertirte en subbot.\n`;
            menuText += `${rmrText}\n\n`;

            const query = text.trim().toUpperCase();

            if (query && menuData[query]) {
                menuText += `┌──「 *${query}* 」──\n`;
                menuData[query].forEach(item => {
                    menuText += `♛ *${item.cmd}* \n> ➠${item.desc}\n`;
                });
                menuText += `└───────────────\n\n`;
            } else {
                for (const [title, cmds] of Object.entries(menuData)) {
                    menuText += `┌──「 *${title.toUpperCase()}* 」──\n`;
                    cmds.forEach(item => {
                        menuText += `♛ *${item.cmd}* \n> ➠${item.desc}\n`;
                    });
                    menuText += `└───────────────\n\n`;
                }
            }

            menuText += `> © Powered by ${developer}.`;

            await conn.sendMessage(m.chat, {
                image: { url: global.img2() },
                caption: menuText,
                mentions: [m.sender],
                contextInfo: { currentChannelInfo }
            }, { quoted: m });

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
