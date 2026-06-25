import { readFileSync } from 'fs';
import { join } from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const pkgPath = join(process.cwd(), 'package.json');
let pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

let cachedTotalReg = 0;
let cachedTotalChats = 0;

function getTotalCommands() {
    return global.commands ? global.commands.size : 0;
}

async function updateCounts() {
    try {
        if (global.User && typeof global.User.countDocuments === 'function') {
            cachedTotalReg = await global.User.countDocuments();
        }
        if (global.Chat && typeof global.Chat.countDocuments === 'function') {
            cachedTotalChats = await global.Chat.countDocuments();
        }
    } catch (e) {

    }
}

updateCounts();
setInterval(updateCounts, 300000);

export const menuCommand = {
    category: 'main',
    commands: {
        help: {
            name: 'menu',
            alias: ['help', 'comandos', 'h'],
            run: async (m, { conn, text }) => {
                try {
                    let uptime = clockString(process.uptime() * 1000);
                    const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇ模 V5.8.0';

                    const botJid = conn.user ? jidNormalizedUser(conn.user.id) : '';
                    const restrictionData = global.restrictionsCache?.get(botJid);
                    const isRestricted = restrictionData?.restrictedMode || false;

                    const senderJid = m.sender;
                    const senderNum = senderJid.split('@')[0];

                    let menuText = `\n〔 Hello, my name is ${name(conn)} 〕\n`;
                    menuText += `➥ ⋄ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 : @${senderNum}\n`;
                    menuText += `➥ ⋄ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘𝚜: ${cachedTotalReg}\n`;
                    menuText += `➥ ⋄ 𝙶𝚛𝚞𝚙𝚘𝚜  : ${cachedTotalChats}\n`;
                    menuText += `➥ ⋄ 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜: ${getTotalCommands()}\n`;
                    menuText += `➥ ⋄ 𝚄𝚙𝚝𝚒𝚖𝚎  : ${uptime}\n`;
                    menuText += `➥ ⋄ 𝚅𝚎𝚛𝚜𝚒𝚘́𝚗  : ${pkg.version}\n`;

                    menuText += `\n\n`;
                    menuText += `${rmrText}\n\n`;

                    const categories = {};
                    if (global.commands) {
                        for (const [_, cmd] of global.commands.entries()) {
                            const cat = (cmd.category || 'general').toUpperCase();
                            if (cat === 'OWNER') continue;
                            if (!categories[cat]) categories[cat] = new Set();

                            let cmdDisplay = cmd.name;
                            if (cmd.alias && Array.isArray(cmd.alias) && cmd.alias.length > 0) {
                                cmdDisplay += ` (${cmd.alias.join(', ')})`;
                            }
                            categories[cat].add(cmdDisplay);
                        }
                    }

                    const query = text.trim().toUpperCase();
                    if (query && categories[query]) {
                        menuText += `┌──「 *${query}* 」──\n`;
                        categories[query].forEach(cmdStr => { menuText += `┃ ♛ *${cmdStr}*\n`; });
                        menuText += `└───────────────\n\n`;
                    } else {
                        for (const [title, cmds] of Object.entries(categories)) {
                            menuText += `┌──「 *${title}* 」──\n`;
                            cmds.forEach(cmdStr => { menuText += `┃ ♛ *${cmdStr}*\n`; });
                            menuText += `└───────────────\n\n`;
                        }
                    }

                    menuText += `> © Powered by ${developer}.`;

                    if (isRestricted) {
                        await conn.sendPreviewMessage(m.chat, menuText, {
                            type: 1, 
                            ratio: 'landscape',
                            url: global.surl(conn),
                            thumbnail: img(conn),
                            title: name(conn),
                            body: `𝚅𝚎𝚛𝚜𝚒𝚘́𝚗  : ${pkg.version}`,
                            quoted: m,
                            mentions: [senderJid],
                            contextInfo: { ...channelInfo, mentionedJid: [senderJid] }
                        });
                    } else {
                        const botonesMenu = [
                            { text: 'SEGUIR CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' },
                            { text: 'COPIAR LINK DEL CANAL', copy: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }
                        ];

                        const opcionesMenu = {
                            title: name(conn),
                            footer: `𝚅𝚎𝚛𝚜ἰó𝚗  : ${pkg.version}`,
                            quoted: m,
                            image: img(conn),
                            mentions: [senderJid]
                        };

                        await conn.sendButtonMessage(m.chat, menuText, botonesMenu, opcionesMenu);
                    }

                } catch (error) {
                    const errorReport = `❌ *REPORT DE ERROR INTERNO*\n\n` +
                                        `• *Módulo:* help.js\n` +
                                        `• *Comando:* menu\n` +
                                        `• *Error:* ${error.message}\n\n` +
                                        `*Trazado de la pila (Stack):*\n\`\`\`${error.stack}\`\`\``;

                    try {
                        await conn.sendMessage(m.chat, { text: errorReport }, { quoted: m });
                    } catch (sendError) {
                        console.error('Incapaz de transmitir el reporte de error al chat de origen:', sendError);
                    }
                }
            }
        }
    }
};


function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
