import { jidNormalizedUser } from '@whiskeysockets/baileys';

const botControl = {
    name: 'estado',
    alias: ['switch', 'bot'],
    category: 'owner',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {
            if (!m.isGroup) return m.reply("『 ❗ 』 Esta función solo puede ejecutarse en terminales de Grupo.");

            let chat = await global.Chat.findOne({ id: m.chat });
            
            if (!chat) {
                chat = await global.Chat.create({ id: m.chat, isBanned: false });
            }

            const action = args[0]?.toLowerCase();

            if (!action || (action !== 'on' && action !== 'off')) {
                const status = chat.isBanned ? '🔴 SUSPENDIDO' : '🟢 OPERATIVO';
                let menu = `『 ⚙️ PANEL DE CONTROL 』\n\n`;
                menu += `◈ *CÓDIGO:* ${usedPrefix + command} <on/off>\n`;
                menu += `◈ *ESTADO:* ${status}\n\n`;
                menu += `> _Usa "off" para apagar el subbot en este grupo o "on" para reactivarlo._\n`;
                menu += `────────────────────`;
                return conn.reply(m.chat, menu, m);
            }

            if (action === 'off') {
                if (chat.isBanned) return m.reply("『 ⚠️ 』 El sistema ya se encuentra fuera de línea.");
                
                await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: true } });
                await m.react("💤");
                
                return conn.sendMessage(m.chat, { 
                    text: `『 🛑 SISTEMA SUSPENDIDO 』\n\nEste terminal ha sido desconectado. El bot dejará de responder a comandos en este grupo.\n\n✦ *Protocolo activado por:* @${m.sender.split('@')[0]}`,
                    mentions: [m.sender],
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }

            if (action === 'on') {
                if (!chat.isBanned) return m.reply("『 ⚠️ 』 El sistema ya está en funcionamiento.");
                
                await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: false } });
                await m.react("⚡");
                
                return conn.sendMessage(m.chat, { 
                    text: `『 ✅ SISTEMA RESTAURADO 』\n\nConexión restablecida con éxito. El subbot vuelve a estar operativo para todos los usuarios.`,
                    contextInfo: { ...global.channelInfo }
                }, { quoted: m });
            }

        } catch (e) {
            console.error("Error en comando estado:", e);
        }
    }
};

export default botControl;
