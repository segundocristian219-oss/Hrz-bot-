import { jidNormalizedUser } from '@whiskeysockets/baileys';

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
                let media = await q.download();
                let { data } = await global.api.upload(media); 
                url = data.url;
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
