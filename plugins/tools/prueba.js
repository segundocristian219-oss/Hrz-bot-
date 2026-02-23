import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'ups'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        if (!isOwner) return m.reply(`> *⚠ Solo mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!/audio|video|image/.test(mime)) return m.reply(`> *✎ Etiqueta un archivo.*`);

        try {
            await m.react('🕓');
            let media = await q.download();
            
            let statusJid = 'status@broadcast';
            
            // Obtenemos los contactos para que el estado sea visible
            // Si no tienes la lista, usamos un array con los JIDs que tengas o vacío
            let contacts = Object.keys(conn.contacts || {});

            let messageOptions = {
                statusForwarded: true,
                backgroundColor: '#000000',
                font: 1
            };

            if (/audio/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    audio: media, 
                    mimetype: 'audio/mp4', 
                    ptt: true,
                    seconds: 30 
                }, { 
                    backgroundColor: '#000000',
                    statusJidList: contacts 
                });
            } else if (/video/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    video: media, 
                    caption: m.text || '' 
                }, { 
                    statusJidList: contacts 
                });
            } else if (/image/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    image: media, 
                    caption: m.text || '' 
                }, { 
                    statusJidList: contacts 
                });
            }

            await m.react('✅');
        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
}

export default statusCommand;
