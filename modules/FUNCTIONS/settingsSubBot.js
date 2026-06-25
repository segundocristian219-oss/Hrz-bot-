import { jidNormalizedUser } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

const uploadToDeylinApi = async (buffer, fileName, mime) => {
    try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mime });
        formData.append('file', blob, fileName);
        const response = await fetch('https://cdn.dix.lat/upload', {
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

export const settingsSubBotCommand = {
    category: 'owner',
    commands: {
        settingsSubBot: {
            name: 'settings-subbot',
            alias: ['setnamebot', 'setimgbot', 'setprefix', 'seturl'],
            run: async (m, { conn, text, command, usedPrefix, isROwner }) => {
                const botJid = jidNormalizedUser(conn.user.id.split(':')[0] + '@s.whatsapp.net');
                const isMainBot = botJid === jidNormalizedUser(global.conn?.user?.id);
                const isPremium = conn.settings?.isprem === true;

                if (!isROwner && !conn.isSub) return;

                if (isMainBot && !isROwner) {
                    return conn.reply(m.chat, '❒ Solo el Desarrollador puede modificar el Bot Principal.', m);
                }

                let settings = await global.SubBotSettings.findOne({ botId: botJid });

                if (!settings) {
                    settings = await global.SubBotSettings.create({ 
                        botId: botJid, 
                        botName: 'Bot', 
                        botImage: null, 
                        botUrl: null,
                        prefix: '.'
                    });
                }

                if (command === 'setnamebot') {
                    if (!isMainBot && !isPremium) {
                        return conn.reply(m.chat, '❌ Exclusivo Premium.', m);
                    }
                    if (!text) return conn.reply(m.chat, `✎ Ingresa el nuevo nombre.`, m);
                    settings.botName = text;
                    await settings.save();
                    global.subbotConfig[botJid] = settings.toObject();
                    conn.settings = global.subbotConfig[botJid];
                    await conn.updateProfileStatus(`${text} | Activo`).catch(() => null);
                    return conn.reply(m.chat, `✓ Nombre actualizado: ${text}`, m);
                }

                if (command === 'seturl') {
                    if (!isMainBot && !isPremium) {
                        return conn.reply(m.chat, '❌ Exclusivo Premium.', m);
                    }
                    if (!text || !text.startsWith('http')) return conn.reply(m.chat, `✎ Ingresa una URL válida.`, m);
                    settings.botUrl = text;
                    await settings.save();
                    global.subbotConfig[botJid] = settings.toObject();
                    conn.settings = global.subbotConfig[botJid];
                    return conn.reply(m.chat, `✓ URL guardada correctamente: ${text} \n\n${botJid}`, m);
                }

                if (command === 'setimgbot') {
                    if (!isMainBot && !isPremium) {
                        return conn.reply(m.chat, '❌ Exclusivo Premium.', m);
                    }
                    let q = m.quoted ? m.quoted : m;
                    let mime = (q.msg || q).mimetype || '';
                    let url = text;

                    if (/image/.test(mime)) {
                        await m.react('🕓');
                        let buffer = await q.download();
                        if (!buffer) return conn.reply(m.chat, '✗ Error al obtener el buffer.', m);

                        const type = await fileTypeFromBuffer(buffer);
                        const fileName = `img_${Date.now()}.${type?.ext || 'png'}`;
                        const result = await uploadToDeylinApi(buffer, fileName, mime);

                        if (!result || !result.url) {
                            await m.react('✖');
                            return conn.reply(m.chat, '✗ Error al subir.', m);
                        }
                        url = result.url;
                        await m.react('✓');
                    } else if (!/^https?:\/\//.test(text)) {
                        return conn.reply(m.chat, '✎ Responde a una imagen o URL.', m);
                    }

                    settings.botImage = url;
                    await settings.save();
                    global.subbotConfig[botJid] = settings.toObject();
                    conn.settings = global.subbotConfig[botJid];
                    return conn.reply(m.chat, '✓ Imagen actualizada correctamente.', m);
                }

                if (command === 'setprefix') {
                    if (!text || text.length > 3) return conn.reply(m.chat, '✎ Prefijo no válido.', m);
                    settings.prefix = text.trim();
                    await settings.save();
                    global.subbotConfig[botJid] = settings.toObject();
                    conn.settings = global.subbotConfig[botJid];
                    return conn.reply(m.chat, `✓ Nuevo prefijo: ${text}`, m);
                }
            }
        }
    }
};
