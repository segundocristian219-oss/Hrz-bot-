import { jidNormalizedUser } from '@whiskeysockets/baileys';

const botControl = {
    name: 'estado',
    alias: ['switch'],
    category: 'main',
    isOwner: true,
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {
            /*
            const ownerList = global.owner || [];
            const isOwnerCustom = isOwner || ownerList.some(owner => owner[0] === m.sender.split('@')[0]);
            if (!isOwnerCustom) return;
            */

            if (!m.isGroup) return m.reply("『 ❗ 』 Esta función solo puede ejecutarse en terminales de Grupo.");

            if (!global.Chat) return console.error("Error: global.Chat no está definido.");

            let chat = await global.Chat.findOne({ id: m.chat });
            if (!chat) chat = await global.Chat.create({ id: m.chat, isBanned: false });

            const action = args[0]?.toLowerCase();

            if (action === 'off') {
                if (chat.isBanned) return m.reply("『 ⚠️ 』 El sistema ya se encuentra fuera de línea.");
                await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: true } });
                await m.react("🔴");
                return conn.sendMessage(m.chat, { 
                    text: `『 🛑 SISTEMA SUSPENDIDO 』\n\nSubbot desactivado en este grupo.\n\n✦ *Por:* @${m.sender.split('@')[0]}`,
                    mentions: [m.sender],
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }

            if (action === 'on') {
                if (!chat.isBanned) return m.reply("『 ⚠️ 』 El sistema ya está en funcionamiento.");
                await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: false } });
                await m.react("🟢");
                return conn.sendMessage(m.chat, { 
                    text: `『 ✅ SISTEMA RESTAURADO 』\n\nConexión restablecida con éxito.`,
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }

            const status = chat.isBanned ? '🔴 SUSPENDIDO' : '🟢 OPERATIVO';
            return conn.sendMessage(m.chat, { 
                text: `『 ⚙️ PANEL DE CONTROL 』\n\n◈ *ESTADO:* ${status}\n◈ *COMANDO:* ${usedPrefix + command} [on/off]\n\n> _Si apagas el bot, solo un Owner podrá encenderlo si el handler lo permite._`,
                contextInfo: { ...global.channelInfo }
            }, { quoted: m });

        } catch (e) {
            console.error("Error en comando estado:", e);
        }
    }
};

export default botControl;
