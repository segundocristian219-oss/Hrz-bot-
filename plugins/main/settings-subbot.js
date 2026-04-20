import { jidNormalizedUser } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

const uploadToDeylinApi = async (buffer, fileName, mime) => {
    try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mime });
        formData.append('file', blob, fileName);
        const response = await fetch('https://api.dix.lat/upload2', {
            method: 'POST',
            body: formData,
            headers: { 'User-Agent': 'Drive-Client' }
        });
        const json = await response.json();
        return (json.status && json.data) ? json.data : null;
    } catch (e) {
        return null;
    }
};

const settingsSubBot = {
    name: 'settings-subbot',
    alias: ['setnamebot', 'setimgbot', 'setprefix'],
    category: 'owner',
    run: async (m, { conn, text, command, usedPrefix }) => {
        const botJid = jidNormalizedUser(conn.user.id);

        if (!conn.isSub) {
            return conn.sendMessage(m.chat, { text: '> ❒ Este comando solo puede ser ejecutado por un Sub-Bot.' }, { quoted: m });
        }

        let settings = await global.SubBotSettings.findOne({ botId: botJid });
        if (!settings) {
            settings = await global.SubBotSettings.create({ 
                botId: botJid, 
                botName: global.name(), 
                botImage: global.img(), 
                prefix: '.' 
            });
        }

        if (command === 'setnamebot') {
            if (!text) return conn.sendMessage(m.chat, { text: `> ✎ Ingresa el nuevo nombre.\n\n*Ejemplo:* ${usedPrefix + command} Kirito-Bot` }, { quoted: m });
            settings.botName = text;
            await settings.save();
            global.subbotConfig[botJid] = settings;
            conn.settings = settings;
            await conn.updateProfileStatus(`${text} | Activo`).catch(() => null);
            return conn.sendMessage(m.chat, { text: `✅ Nombre actualizado a: *${text}*` }, { quoted: m });
        }

        if (command === 'setimgbot') {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let url = text;

            if (/image/.test(mime)) {
                await m.react('🕓');
                let buffer = await q.download();
                const type = await fileTypeFromBuffer(buffer);
                const fileName = `img_${Date.now()}.${type?.ext || 'png'}`;
                const result = await uploadToDeylinApi(buffer, fileName, mime);
                
                if (!result || !result.url) {
                    await m.react('✖️');
                    return conn.sendMessage(m.chat, { text: '> ⚔ Error al subir la imagen a la API.' }, { quoted: m });
                }
                url = result.url;
                await m.react('✅');
            } else if (!/^https?:\/\//.test(text)) {
                return conn.sendMessage(m.chat, { text: `> ✎ Responde a una imagen o proporciona un enlace directo (URL).` }, { quoted: m });
            }

            settings.botImage = url;
            await settings.save();
            global.subbotConfig[botJid] = settings;
            conn.settings = settings;
            return conn.sendMessage(m.chat, { text: `✅ Imagen del bot actualizada con éxito.` }, { quoted: m });
        }

        if (command === 'setprefix') {
            if (!text || text.length > 3) return conn.sendMessage(m.chat, { text: `> ✎ Ingresa un prefijo válido (máximo 3 caracteres).` }, { quoted: m });
            settings.prefix = text.trim();
            await settings.save();
            global.subbotConfig[botJid] = settings;
            conn.settings = settings;
            return conn.sendMessage(m.chat, { text: `✅ Prefijo actualizado a: *${text}*` }, { quoted: m });
        }
    }
};

export default settingsSubBot;
