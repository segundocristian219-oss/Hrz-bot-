import { jidNormalizedUser } from '@whiskeysockets/baileys';

const botToggleCommand = {
    name: 'bot',
    alias: ['subbot', 'estado', 'sistema'],
    category: 'main',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {
            /*
            const ownerList = global.owner || global.config?.owner || [];
            const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

            if (!checkOwner) {
                return conn.reply(m.chat, `✦ Este comando todavía no está disponible para la versión *6.0.1*.\n✧ Por favor, espera la nueva actualización *6.0.2* para acceder al Panel de Control. ✨`, m);
            }
            */

            if (!m.isGroup) {
                return conn.reply(m.chat, `『 ❗ 』 El Sistema de Suspensión solo opera en terminales de Grupo.`, m);
            }

            let chat = global.db.data.chats[m.chat];
            if (!chat) chat = global.db.data.chats[m.chat] = {};

            const action = args[0]?.toLowerCase();

            if (!action || (action !== 'on' && action !== 'off')) {
                let menu = `『 ⚙️ PANEL DE CONTROL DEL SUBBOT 』\n\n`;
                menu += `Gestiona el estado de este terminal en el grupo actual.\n\n`;
                menu += `◈ *APAGAR:* ${usedPrefix + command} off\n`;
                menu += `◈ *ENCENDER:* ${usedPrefix + command} on\n\n`;
                menu += `✦ *ESTADO ACTUAL:* ${chat.isBanned ? '🔴 SUSPENDIDO' : '🟢 ACTIVO'}\n`;
                menu += `────────────────────`;
                return conn.reply(m.chat, menu, m);
            }

            if (action === 'off') {
                if (chat.isBanned) {
                    return conn.reply(m.chat, `『 ⚠️ 』 El subbot ya se encuentra *suspendido* en este grupo.`, m);
                }
                
                chat.isBanned = true;
                await m.react("🔴");
                return conn.reply(m.chat, `『 🛑 SISTEMA SUSPENDIDO 』\n\nEl subbot ha sido desconectado exitosamente de este grupo.\n\n> _Ignoraré todos los comandos aquí hasta que un Owner restaure la conexión con ${usedPrefix + command} on._`, m);
            }

            if (action === 'on') {
                if (!chat.isBanned) {
                    return conn.reply(m.chat, `『 ⚠️ 』 El subbot ya se encuentra *activo* y operando normalmente en este grupo.`, m);
                }
                
                chat.isBanned = false;
                await m.react("🟢");
                return conn.reply(m.chat, `『 ✅ SISTEMA RESTAURADO 』\n\nConexión restablecida con éxito. El subbot vuelve a estar operativo en este grupo.\n\n> _Esperando nuevas órdenes..._ ✨`, m);
            }

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default botToggleCommand;
                  
