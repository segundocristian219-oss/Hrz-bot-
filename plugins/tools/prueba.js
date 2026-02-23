import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __dirname = dirname(fileURLToPath(import.meta.url));

const statusCommand = {
    name: 'setstatus',
    alias: ['estado', 'ups'],
    category: 'owner',
    run: async (m, { conn, isOwner }) => {
        if (!isOwner) return m.reply(`> *⚠ Este comando es solo para mi desarrollador.*`);

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!/audio|video|image/.test(mime)) return m.reply(`> *✎ Etiqueta un audio, video o imagen para subir al estado.*`);

        try {
            await m.react('🕓');
            
            let media = await q.download();
            let statusJid = 'status@broadcast';
            let options = {
                backgroundColor: '#000000',
                font: 3
            };

            if (/audio/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    audio: media, 
                    mimetype: 'audio/mp4', 
                    ptt: true 
                }, { 
                    backgroundColor: options.backgroundColor 
                });
            } else if (/video/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    video: media, 
                    caption: m.text || '' 
                });
            } else if (/image/.test(mime)) {
                await conn.sendMessage(statusJid, { 
                    image: media, 
                    caption: m.text || '' 
                });
            }

            await m.react('✅');
            await m.reply(`> *✅ Contenido subido al estado correctamente.*`);

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            await m.reply(`> *⚠ Error al intentar subir al estado.*`);
        }
    }
}

export default statusCommand;
